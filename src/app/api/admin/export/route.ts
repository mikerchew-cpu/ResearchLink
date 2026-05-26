import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "platform";
  const format = searchParams.get("format") || "json";

  let data: any = {};

  switch (type) {
    case "users":
      data = await supabaseAdmin.from("users").select("id, email, name, university, role, created_at");
      break;
    case "surveys":
      data = await supabaseAdmin.from("surveys").select("id, title, status, response_count, target_responses, created_at");
      break;
    case "responses":
      data = await supabaseAdmin
        .from("responses")
        .select("id, survey_id, points_earned, submitted_at")
        .limit(1000);
      break;
    case "revenue":
      data = await supabaseAdmin
        .from("boost_orders")
        .select("id, amount_myr, tier, status, paid_at")
        .eq("status", "paid");
      break;
    default:
      data = { platform: "ResearchLink Malaysia", version: "1.1", generated_at: new Date().toISOString() };
  }

  if (format === "json") {
    return NextResponse.json(data);
  }

  return NextResponse.json(data);
}
