import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { message, to } = body;

  if (message && to) {
    const watiApiKey = process.env.WATI_API_KEY;
    const watiApiUrl = process.env.WATI_API_URL;

    if (watiApiKey && watiApiUrl) {
      try {
        await fetch(`${watiApiUrl}/api/v1/sendSessionMessage/${to}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${watiApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ messageText: message }),
        });
      } catch (e) {
        console.warn("WATI send failed:", e);
      }
    }
  }

  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WATI_API_KEY) {
    return new NextResponse(challenge);
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
