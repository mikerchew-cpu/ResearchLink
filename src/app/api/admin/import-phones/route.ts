import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.trim().split("\n");
    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV must have a header row and at least one data row" }, { status: 400 });
    }

    const header = lines[0].toLowerCase().split(",").map(h => h.trim());
    const phoneIdx = header.findIndex(h => h === "phone" || h === "telephone" || h === "telephone_no" || h === "number" || h === "whatsapp");
    if (phoneIdx === -1) {
      return NextResponse.json({ error: "CSV must have a 'phone' column" }, { status: 400 });
    }

    const imported: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map(c => c.trim().replace(/^"|"$/g, ""));
      const rawPhone = cols[phoneIdx];
      if (!rawPhone) { skipped.push(`row ${i + 1}: empty phone`); continue; }

      const phone = rawPhone.replace(/[^0-9]/g, "");
      if (phone.length < 10 || phone.length > 13) {
        skipped.push(`row ${i + 1}: invalid phone "${rawPhone}"`);
        continue;
      }

      const { data: existing } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("telephone_no", phone)
        .maybeSingle();

      if (existing) {
        skipped.push(`row ${i + 1}: ${phone} already registered`);
        continue;
      }

      const { error: insertErr } = await supabaseAdmin
        .from("users")
        .insert({
          email: `${phone}@phone.researchlink.app`,
          name: `User ${phone.slice(-4)}`,
          telephone_no: phone,
          university: "unknown",
          role: "respondent",
          credit_balance: 8,
          points_balance: 0,
          has_consented: false,
        });

      if (insertErr) {
        errors.push(`row ${i + 1}: ${phone} - ${insertErr.message}`);
      } else {
        imported.push(phone);
      }
    }

    return NextResponse.json({
      imported: imported.length,
      skipped: skipped.length,
      errors: errors.length,
      detail: { imported, skipped, errors },
    });
  } catch {
    return NextResponse.json({ error: "Failed to process import" }, { status: 500 });
  }
}
