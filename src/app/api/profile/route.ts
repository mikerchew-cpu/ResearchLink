import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: responses } = await supabaseAdmin
    .from("responses")
    .select("id, survey_id, points_earned, submitted_at")
    .eq("respondent_id", session.user.id)
    .order("submitted_at", { ascending: false });

  const { data: txns } = await supabaseAdmin
    .from("reward_txns")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    profile: {
      email: user.email,
      name: user.name,
      university: user.university,
      programme: user.programme,
      year_of_study: user.year_of_study,
      role: user.role,
      credit_balance: user.credit_balance,
      points_balance: user.points_balance,
      created_at: user.created_at,
    },
    responses: responses || [],
    transactions: txns || [],
  });
}
