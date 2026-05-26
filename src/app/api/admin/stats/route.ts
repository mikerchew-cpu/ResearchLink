import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { count: totalUsers } = await supabaseAdmin
    .from("users")
    .select("*", { count: "exact", head: true });

  const { count: activeSurveys } = await supabaseAdmin
    .from("surveys")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const { count: totalResponses } = await supabaseAdmin
    .from("responses")
    .select("*", { count: "exact", head: true });

  const { data: boostRevenue } = await supabaseAdmin
    .from("boost_orders")
    .select("amount_myr")
    .eq("status", "paid")
    .gte("paid_at", new Date(Date.now() - 30 * 86400000).toISOString());

  const { data: campaignRevenue } = await supabaseAdmin
    .from("campaigns")
    .select("amount_myr")
    .eq("status", "completed")
    .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString());

  const boostMrr = (boostRevenue || []).reduce((s: number, r: any) => s + (r.amount_myr || 0), 0);
  const campaignMrr = (campaignRevenue || []).reduce((s: number, r: any) => s + (r.amount_myr || 0), 0);

  const { data: topSurveys } = await supabaseAdmin
    .from("surveys")
    .select("id, title, response_count, is_boosted, topic_tags")
    .eq("status", "active")
    .order("response_count", { ascending: false })
    .limit(10);

  const { data: universityData } = await supabaseAdmin
    .from("users")
    .select("university");

  const uniCount: Record<string, number> = {};
  (universityData || []).forEach((u: any) => {
    if (u.university) uniCount[u.university] = (uniCount[u.university] || 0) + 1;
  });

  const universityBreakdown = Object.entries(uniCount)
    .map(([university, users]) => ({ university, users }))
    .sort((a, b) => b.users - a.users);

  const { count: consentResearch } = await supabaseAdmin
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("consent_research", true);

  const { count: consentBrand } = await supabaseAdmin
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("consent_brand", true);

  const totalUsersCount = totalUsers || 1;
  const consentRate = Math.round(((consentResearch || 0) / totalUsersCount) * 100);

  return NextResponse.json({
    kpis: {
      totalUsers: totalUsers || 0,
      activeSurveys: activeSurveys || 0,
      totalResponses: totalResponses || 0,
      mrr: boostMrr + campaignMrr,
      boostMrr,
      campaignMrr,
    },
    charts: {
      revenueByMonth: [],
      usersByMonth: [],
      topicDistribution: {},
    },
    tables: {
      topSurveys: topSurveys || [],
      universityBreakdown,
    },
    pdpa: {
      consentResearch: consentResearch || 0,
      consentBrand: consentBrand || 0,
      consentRate,
    },
  });
}
