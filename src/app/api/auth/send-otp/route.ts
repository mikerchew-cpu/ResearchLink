import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain || !domain.endsWith(".edu.my")) {
      return NextResponse.json({ error: "not-edu-email" }, { status: 400 });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "Server config error" }, { status: 500 });
    }
    const sb = createClient(supabaseUrl, supabaseAnonKey);
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ sent: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}