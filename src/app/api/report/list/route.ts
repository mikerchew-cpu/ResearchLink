// src/app/api/report/list/route.ts
// GET /api/report/list — list published (and draft) reports for admin

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await auth();

  // Public: only published reports
  // Admin: all reports including drafts
  const isAdmin = session?.user?.role === "admin";

  let query = supabaseAdmin
    .from("published_reports")
    .select("id, title, price_myr, is_published, generated_at, purchase_count")
    .order("generated_at", { ascending: false });

  if (!isAdmin) query = query.eq("is_published", true);

  const { data } = await query;

  return NextResponse.json({ published: data ?? [], reports: data ?? [] });
}
