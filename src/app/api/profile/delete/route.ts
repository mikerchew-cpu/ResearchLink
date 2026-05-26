import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function DELETE() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabaseAdmin.from("consent_audit_log").delete().eq("user_id", session.user.id);
  await supabaseAdmin.from("reward_txns").delete().eq("user_id", session.user.id);
  await supabaseAdmin.from("responses").delete().eq("respondent_id", session.user.id);
  await supabaseAdmin.from("surveys").delete().eq("creator_id", session.user.id);
  await supabaseAdmin.from("users").delete().eq("id", session.user.id);

  return NextResponse.json({ success: true });
}
