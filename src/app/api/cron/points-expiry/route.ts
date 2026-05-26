import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sixMonthsAgo = new Date(Date.now() - 180 * 86400000).toISOString();

  const { data: expiringUsers } = await supabaseAdmin
    .from("reward_txns")
    .select("user_id, sum(points)")
    .lt("created_at", sixMonthsAgo)
    .gt("points", 0)
    .limit(100);

  if (expiringUsers) {
    for (const entry of expiringUsers) {
      const userId = (entry as any).user_id;
      const points = (entry as any).sum || 0;

      if (points > 0) {
        await supabaseAdmin.from("reward_txns").insert({
          user_id: userId,
          type: "expiry",
          points: -points,
          description: "Points expired (6-month validity)",
        });
      }
    }
  }

  return NextResponse.json({ success: true, processed: expiringUsers?.length || 0 });
}
