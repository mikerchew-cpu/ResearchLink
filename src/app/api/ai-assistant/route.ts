import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { survey_title, survey_description, question } = await req.json();

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return NextResponse.json({ error: "AI assistant not configured" }, { status: 503 });
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: `You are a survey design coach for Malaysian university students. The survey is titled "${survey_title}" with description "${survey_description}". Answer this question: ${question}`,
          },
        ],
      }),
    });

    const data = await res.json();
    const answer = data.content?.[0]?.text || "No response from AI.";
    return NextResponse.json({ answer });
  } catch (e) {
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}
