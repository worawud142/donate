import { NextResponse } from "next/server";
import { requireAdmin } from "../_guard";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return NextResponse.json({ ok: false, message: guard.message }, { status: guard.status });

  const { data, error } = await guard.supabase
    .from("donations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, items: data });
}
