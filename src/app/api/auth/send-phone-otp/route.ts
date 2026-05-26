import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    if (!phone || typeof phone !== "string") {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }
    const cleaned = phone.replace(/[^0-9]/g, "");
    if (cleaned.length < 10 || cleaned.length > 13) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }
    const code = generateOtpCode();
    await supabaseAdmin.from("otp_codes").insert({
      phone: cleaned,
      code,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });
    const ultramsgToken = process.env.ULTRAMSG_TOKEN;
    const ultramsgInstanceId = process.env.ULTRAMSG_INSTANCE_ID;
    if (ultramsgToken && ultramsgInstanceId) {
      const params = new URLSearchParams({
        token: ultramsgToken,
        to: cleaned,
        body: `Your ResearchLink verification code: ${code}\n\nValid for 5 minutes.`,
      });
      await fetch(`https://api.ultramsg.com/${ultramsgInstanceId}/messages/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
    }
    return NextResponse.json({ sent: true });
  } catch {
    return NextResponse.json({ error: "Failed to send code" }, { status: 500 });
  }
}