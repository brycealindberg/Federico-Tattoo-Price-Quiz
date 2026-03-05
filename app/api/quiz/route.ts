import { createServiceClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const count = parseInt(searchParams.get("count") || "10", 10);
  const safeCount = Math.min(Math.max(count, 1), 50);

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("tattoos")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "No tattoos found" }, { status: 404 });
  }

  const shuffled = data.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(safeCount, shuffled.length));

  return NextResponse.json({ tattoos: selected, total: data.length });
}
