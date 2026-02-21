// app/api/admin/update/route.ts
import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, message: msg }, { status });
}

export async function POST(req: Request) {
  try {
    const item = await req.json();

    if (!item.id) return bad("ไม่พบ ID รายการ");

    const supabase = supabaseService();

    // Validate required fields
    if (!item.full_name || !item.amount || !item.transfer_date) {
      return bad("กรุณากรอกข้อมูลที่จำเป็น (ชื่อ, จำนวนเงิน, วันที่)");
    }

    // Validate amount
    const amount = Number(item.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return bad("จำนวนเงินไม่ถูกต้อง");
    }

    // Validate alumni batch if provided
    if (item.alumni_batch !== null && item.alumni_batch !== undefined) {
      const batch = Number(item.alumni_batch);
      if (!Number.isInteger(batch) || batch < 0) {
        return bad("รุ่นศิษย์เก่าต้องเป็นตัวเลขบวกหรือว่าง");
      }
      item.alumni_batch = batch;
    }

    // Update the donation record
    const { data, error } = await supabase
      .from("donations")
      .update({
        full_name: item.full_name.trim(),
        alumni_batch: item.alumni_batch,
        donor_type: item.donor_type,
        team_name: item.team_name || null,
        amount: amount,
        transfer_date: item.transfer_date,
        channel: item.channel || null,
        phone: item.phone || null,
        message: item.message || null,
      })
      .eq("id", item.id)
      .select()
      .single();

    if (error) return bad(`อัปเดตรายการล้มเหลว: ${error.message}`, 500);

    // Revalidate paths to clear Next.js cache
    revalidatePath("/");
    revalidatePath("/board");
    revalidatePath("/donors");
    revalidatePath("/admin/donors");

    return NextResponse.json({
      ok: true,
      message: "อัปเดตรายการสำเร็จ",
      item: data
    });
  } catch (e: any) {
    return bad(e?.message || "เกิดข้อผิดพลาด", 500);
  }
}
