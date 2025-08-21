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
