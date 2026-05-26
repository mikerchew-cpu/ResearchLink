import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { student_id, message } = await req.json();

  if (!student_id || !message) {
    return NextResponse.json({ error: "student_id and message required" }, { status: 400 });
  }

  const watiApiKey = process.env.WATI_API_KEY;
  const watiApiUrl = process.env.WATI_API_URL;

  if (watiApiKey && watiApiUrl) {
    try {
      await fetch(`${watiApiUrl}/api/v1/sendSessionMessage/${student_id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${watiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messageText: message }),
      });
    } catch (e) {
      console.warn("WATI notification failed:", e);
    }
  }

  return NextResponse.json({ success: true });
}
