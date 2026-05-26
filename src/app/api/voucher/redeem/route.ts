import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { voucher_pool_id } = await req.json();

  if (!voucher_pool_id) {
    return NextResponse.json({ error: "voucher_pool_id required" }, { status: 400 });
  }

  const { data: voucher } = await supabaseAdmin
    .from("voucher_pool")
    .select("*")
    .eq("id", voucher_pool_id)
    .is("redeemed_at", null)
    .single();

  if (!voucher) {
    return NextResponse.json({ error: "Voucher unavailable" }, { status: 404 });
  }

  const pointsRequired = voucher.rm_value * 50;

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("points_balance")
    .eq("id", session.user.id)
    .single();

  if (!user || user.points_balance < pointsRequired) {
    return NextResponse.json({ error: "Insufficient points" }, { status: 403 });
  }

  await supabaseAdmin
    .from("voucher_pool")
    .update({
      redeemed_by: session.user.id,
      redeemed_at: new Date().toISOString(),
    })
    .eq("id", voucher_pool_id);

  await supabaseAdmin
    .from("users")
    .update({ points_balance: user.points_balance - pointsRequired })
    .eq("id", session.user.id);

  await supabaseAdmin.from("reward_txns").insert({
    user_id: session.user.id,
    type: "redeem",
    points: -pointsRequired,
    description: `Redeemed ${voucher.brand} RM ${voucher.rm_value}`,
  });

  return NextResponse.json({ code: voucher.code });
}
