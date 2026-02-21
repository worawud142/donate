import { NextResponse } from "next/server";
import { requireAdmin } from "../_guard";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return NextResponse.json({ ok: false, message: guard.message }, { status: guard.status });

  const { id } = await req.json();
  const { data, error } = await guard.supabase
    .from("donations")
    .update({ verified: false, status: "rejected", updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, item: data });
}
