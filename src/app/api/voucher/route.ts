import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const VOUCHER_RATES = [
  { brand: "Shopee", rm_value: 2.00, points_required: 100 },
  { brand: "Shopee", rm_value: 5.00, points_required: 250 },
  { brand: "TNG eWallet", rm_value: 5.00, points_required: 300 },
  { brand: "TNG eWallet", rm_value: 10.00, points_required: 600 },
  { brand: "GrabFood", rm_value: 5.00, points_required: 300 },
  { brand: "ZUS Coffee", rm_value: 5.00, points_required: 250 },
];

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ rates: VOUCHER_RATES });
}
