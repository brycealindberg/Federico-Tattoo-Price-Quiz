import { createServiceClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("tattoos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tattoos: data });
}

export async function DELETE(request: NextRequest) {
  const { id, image_url } = await request.json();
  const supabase = createServiceClient();

  if (image_url) {
    const path = image_url.split("/tattoo-images/")[1];
    if (path) {
      await supabase.storage.from("tattoo-images").remove([path]);
    }
  }

  const { error } = await supabase.from("tattoos").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
