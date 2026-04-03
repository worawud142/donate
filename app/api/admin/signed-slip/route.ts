import { NextResponse } from "next/server";
import { requireAdmin } from "../_guard";

export const runtime = "nodejs";

const SLIP_PREVIEW_TRANSFORM = {
  width: 1200,
  height: 1600,
  resize: "contain" as const,
  quality: 70,
};

export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return NextResponse.json({ ok: false, message: guard.message }, { status: guard.status });

  const { slip_path } = await req.json();

  const { data, error } = await guard.supabase.storage
    .from("slips")
    .createSignedUrl(slip_path, 60 * 5, {
      transform: SLIP_PREVIEW_TRANSFORM,
    });

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, url: data.signedUrl });
}
