import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAdminAuth() {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return null;
  }
  
  const { data: user } = await supabase
    .from("users")
    .select("id, role")
    .eq("email", session.user.email)
    .single();
    
  return user?.role === 'admin' ? user : null;
}

export async function POST(request: Request) {
  try {
    const adminUser = await checkAdminAuth();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { eventIds, action } = await request.json();
    
    let updateData: any = {
      updated_at: new Date().toISOString()
    };

    switch (action) {
      case 'publish':
        updateData.is_published = true;
        break;
      case 'unpublish':
        updateData.is_published = false;
        break;
      case 'delete':
        const { error: deleteError } = await supabase
          .from("events")
          .delete()
          .in("id", eventIds);
        
        if (deleteError) throw deleteError;
        return NextResponse.json({ success: true });
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("events")
      .update(updateData)
      .in("id", eventIds)
      .select();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
