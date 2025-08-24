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

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const adminUser = await checkAdminAuth();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { is_featured } = await request.json();
    
    const { data, error } = await supabase
      .from("events")
      .update({ 
        is_featured,
        updated_at: new Date().toISOString()
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
