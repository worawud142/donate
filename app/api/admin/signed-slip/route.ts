import { NextResponse } from "next/server";
import { requireAdmin } from "../_guard";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return NextResponse.json({ ok: false, message: guard.message }, { status: guard.status });

  const { slip_path } = await req.json();

  const { data, error } = await guard.supabase.storage
    .from("slips")
    .createSignedUrl(slip_path, 60 * 5); // 5 นาที

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, url: data.signedUrl });
}
