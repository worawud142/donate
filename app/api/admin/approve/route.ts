import { NextResponse } from "next/server";
import { requireAdmin } from "../_guard";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return NextResponse.json({ ok: false, message: guard.message }, { status: guard.status });

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ ok: false, message: "ไม่พบ ID รายการ" }, { status: 400 });
  }

  const { data, error } = await guard.supabase
    .from("donations")
    .update({
      verified: true,
      publish: true,
      status: "approved",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });

  revalidatePath("/");
  revalidatePath("/board");
  revalidatePath("/admin/board");
  revalidatePath("/donors");
  revalidatePath("/admin/donors");

  return NextResponse.json({ ok: true, item: data });
}
