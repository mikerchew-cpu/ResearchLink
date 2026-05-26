import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { survey_id, title, description } = await req.json();

  if (!survey_id) return NextResponse.json({ error: "survey_id required" }, { status: 400 });

  const openaiKey = process.env.OPENAI_API_KEY;
  let tags: string[] = [];

  if (openaiKey) {
    try {
      const prompt = `Given this survey title and description, suggest 2-4 topic tags in JSON array format. Title: ${title}. Description: ${description}`;
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
        }),
      });
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        tags = Array.isArray(parsed) ? parsed : [parsed];
      }
    } catch (e) {
      console.warn("Tagging failed, using defaults:", e);
    }
  }

  if (tags.length === 0) tags = ["General"];

  await supabaseAdmin.from("surveys").update({ topic_tags: tags }).eq("id", survey_id);

  return NextResponse.json({ tags });
}
