import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { survey_id, reason } = await req.json();

  if (!survey_id || !reason) {
    return NextResponse.json({ error: "survey_id and reason required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("survey_reports").insert({
    survey_id,
    reported_by: session.user.id,
    reason,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const isQueue = searchParams.get("queue") === "true";

  if (isQueue) {
    const { data: queue } = await supabaseAdmin
      .from("moderation_queue")
      .select("*, survey:surveys!survey_id(title)")
      .eq("reviewed", false)
      .order("created_at", { ascending: true });

    const mapped = (queue || []).map((item: any) => ({
      id: item.id,
      survey_id: item.survey_id,
      title: item.survey?.title || "Unknown",
      reason: item.reason,
      reported_by: item.reported_by,
      created_at: item.created_at,
    }));

    return NextResponse.json({ queue: mapped });
  }

  const { data: reports } = await supabaseAdmin
    .from("survey_reports")
    .select("*, survey:surveys!survey_id(title)")
    .eq("reviewed", false)
    .order("created_at", { ascending: false });

  return NextResponse.json({ reports: reports || [] });
}
