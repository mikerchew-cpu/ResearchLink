// src/app/api/admin/health/route.ts
// GET /api/admin/health — platform health metrics from v_platform_health view

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  // Query the view directly
  const { data, error } = await supabaseAdmin
    .from("v_platform_health")
    .select("*")
    .single();

  if (error) {
    // View may not exist yet — return safe defaults
    console.warn("[Admin Health] View not ready:", error.message);
    return NextResponse.json({
      total_users: 0, new_users_7d: 0, active_surveys: 0,
      boosted_surveys: 0, responses_7d: 0,
      boost_revenue_30d: 0, campaign_revenue_30d: 0,
      pending_moderation: 0, pending_reports: 0, waitlist_signups: 0,
    });
  }

  return NextResponse.json(data);
}
