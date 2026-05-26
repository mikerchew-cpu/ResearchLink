import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { consent_research, consent_brand } = await req.json();

  await supabaseAdmin
    .from("users")
    .update({
      consent_research,
      consent_brand,
      has_consented: true,
    })
    .eq("id", session.user.id);

  await supabaseAdmin.from("consent_audit_log").insert({
    user_id: session.user.id,
    consent_research,
    consent_brand,
    ip_address: req.headers.get("x-forwarded-for") || "unknown",
  });

  return NextResponse.json({ success: true });
}
