import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: surveys } = await supabaseAdmin
    .from("surveys")
    .select("*")
    .eq("creator_id", session.user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ surveys: surveys || [] });
}
