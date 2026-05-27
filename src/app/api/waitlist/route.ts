import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { phone, university, role } = await req.json();

  const cleaned = (phone || "").replace(/[^0-9]/g, "");
  if (!cleaned || cleaned.length < 10)
    return NextResponse.json({ error: "Valid phone number required" }, { status: 400 });

  const { error } = await supabaseAdmin.from("waitlist").insert({
    email: cleaned,
    university: university || null,
    role: role || "respondent",
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Already on waitlist" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("count") === "true") {
    const { count } = await supabaseAdmin
      .from("waitlist")
      .select("*", { count: "exact", head: true });
    return NextResponse.json({ count: count || 0 });
  }

  return NextResponse.json({ error: "Use ?count=true" }, { status: 400 });
}
