import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tag = searchParams.get("tag");

  let query = supabaseAdmin
    .from("surveys")
    .select("*, creator:users!creator_id(name, university, faculty)")
    .eq("status", "active")
    .order("is_boosted", { ascending: false })
    .order("created_at", { ascending: false });

  if (tag) {
    query = query.contains("topic_tags", [tag]);
  }

  const { data: surveys } = await query;

  const { data: allTags } = await supabaseAdmin
    .from("surveys")
    .select("topic_tags")
    .eq("status", "active");

  const tags = [...new Set((allTags || []).flatMap((s: any) => s.topic_tags || []))].filter(Boolean);

  const mapped = (surveys || []).map((s: any) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    topic_tags: s.topic_tags,
    is_boosted: s.is_boosted,
    target_responses: s.target_responses,
    response_count: s.response_count,
    points: s.points || 10,
    estimated_minutes: s.estimated_minutes || 5,
    university: s.creator?.university,
    faculty: s.creator?.faculty,
    creator_name: s.creator?.name,
    creator_id: s.creator_id,
    survey_url: s.survey_url,
  }));

  return NextResponse.json({ surveys: mapped, tags });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, survey_url, target_responses, target_faculty, target_year } = body;

  if (!title || !survey_url) {
    return NextResponse.json({ error: "Title and survey URL are required" }, { status: 400 });
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("credit_balance")
    .eq("id", session.user.id)
    .single();

  if (!user || user.credit_balance < 5) {
    return NextResponse.json({ error: "Insufficient credits" }, { status: 403 });
  }

  const { data: survey, error } = await supabaseAdmin
    .from("surveys")
    .insert({
      creator_id: session.user.id,
      title,
      description,
      survey_url,
      target_responses: target_responses || 100,
      target_faculty: target_faculty || null,
      target_year: target_year || null,
      status: "pending",
      topic_tags: [],
      response_count: 0,
      points: 10,
      estimated_minutes: 5,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin
    .from("users")
    .update({ credit_balance: user.credit_balance - 5 })
    .eq("id", session.user.id);

  const tokenSecret = process.env.COMPLETION_TOKEN_SECRET || "dev-secret";
  const token = Buffer.from(`${survey.id}:${session.user.id}:${Date.now()}`).toString("base64");
  const tokenUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/complete?token=${token}&survey_id=${survey.id}`;

  return NextResponse.json({ survey, token_url: tokenUrl });
}
