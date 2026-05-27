import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from("users")
      .select("id, name, email, telephone_no, role, university, credit_balance, created_at", { count: "exact" })
      .not("telephone_no", "is", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (q) {
      query = query.or(`telephone_no.ilike.%${q}%,name.ilike.%${q}%,email.ilike.%${q}%`);
    }

    const { data, count, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data: data || [], total: count || 0, page, limit });
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });

    const { error } = await supabaseAdmin
      .from("users")
      .update({ telephone_no: null })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to remove" }, { status: 500 });
  }
}
