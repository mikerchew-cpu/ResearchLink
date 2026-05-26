import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const VOUCHER_RATES = [
  { id: "shp-2",   brand: "Shopee", rm_value: 2.00, points_required: 100 },
  { id: "shp-5",   brand: "Shopee", rm_value: 5.00, points_required: 250 },
  { id: "tng-5",   brand: "TNG eWallet", rm_value: 5.00, points_required: 300 },
  { id: "tng-10",  brand: "TNG eWallet", rm_value: 10.00, points_required: 600 },
  { id: "grab-5",  brand: "GrabFood", rm_value: 5.00, points_required: 300 },
  { id: "zus-5",   brand: "ZUS Coffee", rm_value: 5.00, points_required: 250 },
];

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ rates: VOUCHER_RATES });
}
