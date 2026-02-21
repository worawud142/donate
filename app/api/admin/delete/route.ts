// app/api/admin/delete/route.ts
import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase-server";

export const runtime = "nodejs";

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, message: msg }, { status });
}

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    
    if (!id) return bad("ไม่พบ ID รายการ");

    const supabase = supabaseService();

    // First, delete the slip file if it exists and is not a cash donation
    const { data: donation } = await supabase
      .from("donations")
      .select("slip_path")
      .eq("id", id)
      .single();

    if (donation?.slip_path && donation.slip_path !== "cash_donation_no_slip") {
      // Delete the slip file from storage
      await supabase.storage.from("slips").remove([donation.slip_path]);
    }

    // Delete the donation record
    const { error } = await supabase.from("donations").delete().eq("id", id);

    if (error) return bad(`ลบรายการล้มเหลว: ${error.message}`, 500);

    return NextResponse.json({ ok: true, message: "ลบรายการสำเร็จ" });
  } catch (e: any) {
    return bad(e?.message || "เกิดข้อผิดพลาด", 500);
  }
}
