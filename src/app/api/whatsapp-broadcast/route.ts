import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { survey_id, message } = await req.json();
  if (!survey_id) {
    return NextResponse.json({ error: "survey_id is required" }, { status: 400 });
  }

  const survey = await supabaseAdmin
    .from("surveys")
    .select("*")
    .eq("id", survey_id)
    .single();

  if (!survey.data || survey.data.creator_id !== session.user.id) {
    return NextResponse.json({ error: "Not found or not your survey" }, { status: 404 });
  }

  const ultramsgToken = process.env.ULTRAMSG_TOKEN;
  const ultramsgInstanceId = process.env.ULTRAMSG_INSTANCE_ID;
  if (!ultramsgToken || !ultramsgInstanceId) {
    return NextResponse.json({ error: "UltraMsg not configured" }, { status: 501 });
  }

  const surveyUrl = survey.data.survey_url;
  const defaultMessage = message || `New survey: ${survey.data.title}\n\n${surveyUrl}\n\nEarn ${survey.data.points} points for completing!`;

  const { data: students } = await supabaseAdmin
    .from("users")
    .select("id, telephone_no")
    .not("telephone_no", "is", null)
    .not("telephone_no", "eq", "");

  if (!students || students.length === 0) {
    return NextResponse.json({ sent: 0, total: 0, error: "No students with phone numbers" });
  }

  let sentCount = 0;
  for (const student of students) {
    try {
      const phone = student.telephone_no!.replace(/[^0-9]/g, "");
      const params = new URLSearchParams({
        token: ultramsgToken,
        to: phone,
        body: defaultMessage,
      });
      const res = await fetch(
        `https://api.ultramsg.com/${ultramsgInstanceId}/messages/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString(),
        }
      );
      if (res.ok) sentCount++;
    } catch {
      // skip failed sends
    }
  }

  await supabaseAdmin.from("broadcast_log").insert({
    survey_id,
    sent_by: session.user.id,
    total_target: students.length,
    sent_count: sentCount,
  });

  return NextResponse.json({ sent: sentCount, total: students.length });
}