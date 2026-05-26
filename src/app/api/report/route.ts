import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const TEMPLATES: Record<string, { title: string; price_myr: number }> = {
  "genz-financial-2025": { title: "Malaysian Gen-Z Financial Behaviour 2025", price_myr: 3800 },
  "campus-brand-fb-2025": { title: "Campus Brand Perception Report: F&B Sector", price_myr: 2800 },
  "ev-adoption-2025": { title: "EV Adoption Readiness Among Malaysian Students", price_myr: 2500 },
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { templateId, customTitle, dateFrom } = await req.json();
  const template = TEMPLATES[templateId];

  if (!template) return NextResponse.json({ error: "Invalid template" }, { status: 400 });

  const openaiKey = process.env.OPENAI_API_KEY;
  let content = "Sample report content. Replace with AI-generated content.";

  if (openaiKey) {
    try {
      const { data: surveys } = await supabaseAdmin
        .from("surveys")
        .select("title, response_count, topic_tags, created_at")
        .gte("created_at", dateFrom || new Date(Date.now() - 90 * 86400000).toISOString())
        .limit(50);

      const surveyData = JSON.stringify(surveys || []);
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: `Generate a research report titled "${customTitle || template.title}" based on this survey data: ${surveyData}. Include: executive summary, key findings, recommendations. Format as markdown.`,
            },
          ],
        }),
      });
      const data = await res.json();
      content = data.choices?.[0]?.message?.content || content;
    } catch (e) {
      console.warn("Report generation failed:", e);
    }
  }

  const { data: report, error } = await supabaseAdmin
    .from("published_reports")
    .insert({
      title: customTitle || template.title,
      price_myr: template.price_myr,
      category: templateId,
      content,
      is_published: false,
      generated_at: new Date().toISOString(),
      purchase_count: 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ report_id: report.id });
}
