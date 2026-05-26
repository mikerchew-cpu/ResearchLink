import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brand, objective, target_audience, budget_myr } = await req.json();

  if (!brand || !objective) {
    return NextResponse.json({ error: "Brand and objective required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("campaigns")
    .insert({
      brand,
      objective,
      target_audience: target_audience || null,
      amount_myr: budget_myr || 5000,
      status: "pending",
      created_by: session.user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
