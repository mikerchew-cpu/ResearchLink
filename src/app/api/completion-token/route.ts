import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token, survey_id } = await req.json();

  if (!token || !survey_id) {
    return NextResponse.json({ error: "Token and survey_id required" }, { status: 400 });
  }

  const parts = token.split(":");
  if (parts.length < 3) {
    return NextResponse.json({ error: "Invalid token format" }, { status: 400 });
  }

  const [surveyId, userId, timestamp] = parts;
  if (surveyId !== survey_id) {
    return NextResponse.json({ error: "Token does not match survey" }, { status: 400 });
  }

  const age = Date.now() - parseInt(timestamp);
  const twoHours = 2 * 60 * 60 * 1000;
  if (age > twoHours) {
    return NextResponse.json({ error: "Token expired" }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from("responses")
    .select("id")
    .eq("survey_id", survey_id)
    .eq("respondent_id", session.user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Duplicate response" }, { status: 409 });
  }

  const { data: survey } = await supabaseAdmin
    .from("surveys")
    .select("points, creator_id")
    .eq("id", survey_id)
    .single();

  const points = survey?.points || 10;

  await supabaseAdmin.from("responses").insert({
    survey_id,
    respondent_id: session.user.id,
    points_earned: points,
  });

  await supabaseAdmin
    .from("surveys")
    .update({ response_count: supabaseAdmin.rpc("increment") })
    .eq("id", survey_id);

  await supabaseAdmin
    .from("users")
    .update({ points_balance: supabaseAdmin.rpc("increment", { amount: points }) })
    .eq("id", session.user.id);

  await supabaseAdmin.rpc("award_credit_on_response", { p_user_id: session.user.id });

  await supabaseAdmin.from("reward_txns").insert({
    user_id: session.user.id,
    type: "earn",
    points,
    description: `Survey response: ${survey_id}`,
  });

  return NextResponse.json({ success: true, points });
}
