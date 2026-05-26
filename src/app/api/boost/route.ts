import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { survey_id, tier } = await req.json();
  const prices: Record<string, number> = { basic: 20, featured: 50 };

  if (!survey_id || !tier || !prices[tier]) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { data: order, error } = await supabaseAdmin
    .from("boost_orders")
    .insert({
      survey_id,
      user_id: session.user.id,
      tier,
      amount_myr: prices[tier],
      status: "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const merchantCode = process.env.IPAY88_MERCHANT_CODE || "dummy";
  const merchantKey = process.env.IPAY88_MERCHANT_KEY || "dummy";
  const signature = Buffer.from(`${merchantCode}${order.id}${prices[tier]}MYR${merchantKey}`).toString("base64");

  const redirectUrl = `https://payment.ipay88.com.my/epayment/entry.asp?MerchantCode=${merchantCode}&RefNo=${order.id}&Amount=${prices[tier]}&Currency=MYR&Signature=${signature}&ResponseURL=${process.env.NEXTAUTH_URL}/my-surveys&BackendURL=${process.env.NEXTAUTH_URL}/api/boost/webhook`;

  return NextResponse.json({ order, redirect_url: redirectUrl });
}

export async function PUT(req: NextRequest) {
  const body = await req.text();
  const params = new URLSearchParams(body);
  const refNo = params.get("RefNo");
  const status = params.get("Status");

  if (refNo && status === "1") {
    await supabaseAdmin
      .from("boost_orders")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", refNo);

    const { data: order } = await supabaseAdmin
      .from("boost_orders")
      .select("survey_id, tier")
      .eq("id", refNo)
      .single();

    if (order) {
      const hours = order.tier === "featured" ? 72 : 48;
      await supabaseAdmin
        .from("surveys")
        .update({
          is_boosted: true,
          boost_expires_at: new Date(Date.now() + hours * 3600000).toISOString(),
        })
        .eq("id", order.survey_id);
    }
  }

  return NextResponse.json({ ok: true });
}
