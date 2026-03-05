import { createServiceClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("image") as File;
  const price = parseInt(formData.get("price") as string, 10);

  if (!file || !price || price <= 0) {
    return NextResponse.json(
      { error: "Image and valid price required" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const { error: uploadError } = await supabase.storage
    .from("tattoo-images")
    .upload(fileName, file, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json(
      { error: uploadError.message },
      { status: 500 }
    );
  }

  const { data: urlData } = supabase.storage
    .from("tattoo-images")
    .getPublicUrl(fileName);

  const { data, error: dbError } = await supabase
    .from("tattoos")
    .insert({ image_url: urlData.publicUrl, price })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ tattoo: data });
}
