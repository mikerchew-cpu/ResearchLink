import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const isLeaderboard = searchParams.get("leaderboard") === "true";

  if (isLeaderboard) {
    const { data } = await supabaseAdmin
      .from("reward_txns")
      .select("user_id, points, description")
      .eq("type", "referral")
      .limit(100);

    const counts: Record<string, number> = {};
    (data || []).forEach((t: any) => {
      counts[t.user_id] = (counts[t.user_id] || 0) + 1;
    });

    const leaderboard = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([userId, count]) => ({ user_id: userId, count }));

    return NextResponse.json({ leaderboard });
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("referral_code")
    .eq("id", session.user.id)
    .single();

  const { data: referrals } = await supabaseAdmin
    .from("reward_txns")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("type", "referral");

  const { data: referralPoints } = await supabaseAdmin
    .from("reward_txns")
    .select("points")
    .eq("user_id", session.user.id)
    .eq("type", "referral");

  const totalPoints = (referralPoints || []).reduce((sum: number, t: any) => sum + t.points, 0);

  return NextResponse.json({
    code: user?.referral_code || "",
    count: referrals?.length || 0,
    points: totalPoints,
  });
}

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 });

  const { data: referrer } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("referral_code", code)
    .single();

  if (!referrer) return NextResponse.json({ error: "Invalid code" }, { status: 400 });

  return NextResponse.json({ referrer_id: referrer.id });
}
