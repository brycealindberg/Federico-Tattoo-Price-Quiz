import { createServiceClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("image") as File;
  const priceMin = parseInt(formData.get("price_min") as string, 10);
  const priceMax = parseInt(formData.get("price_max") as string, 10);
  const description = (formData.get("description") as string) || "";

  if (!file || !priceMin || priceMin <= 0 || !priceMax || priceMax < priceMin) {
    return NextResponse.json(
      { error: "Image and valid price range required (max >= min > 0)" },
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
    .insert({ image_url: urlData.publicUrl, price_min: priceMin, price_max: priceMax, description })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ tattoo: data });
}
