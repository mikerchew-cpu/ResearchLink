import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: survey } = await supabaseAdmin
    .from("surveys")
    .select("*, creator:users!creator_id(name, university)")
    .eq("id", params.id)
    .single();

  if (!survey) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: existingResponse } = await supabaseAdmin
    .from("responses")
    .select("id")
    .eq("survey_id", params.id)
    .eq("respondent_id", session.user.id)
    .maybeSingle();

  return NextResponse.json({
    id: survey.id,
    title: survey.title,
    description: survey.description,
    survey_url: survey.survey_url,
    status: survey.status,
    response_count: survey.response_count,
    target_responses: survey.target_responses,
    is_boosted: survey.is_boosted,
    created_at: survey.created_at,
    creator_name: survey.creator?.name,
    creator_university: survey.creator?.university,
    topic_tags: survey.topic_tags,
    already_responded: !!existingResponse,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data, error } = await supabaseAdmin
    .from("surveys")
    .update(body)
    .eq("id", params.id)
    .eq("creator_id", session.user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabaseAdmin
    .from("surveys")
    .delete()
    .eq("id", params.id)
    .eq("creator_id", session.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
