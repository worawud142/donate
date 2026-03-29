// app/api/donate/route.ts
import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase-server";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, message: msg }, { status });
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const full_name = String(form.get("full_name") || "").trim();
    const alumni_batch_raw = String(form.get("alumni_batch") || "").trim();
    const donor_type = String(form.get("donor_type") || "public").trim();
    const team_name = String(form.get("team_name") || "").trim();
    const amount_raw = String(form.get("amount") || "").trim();
    const donation_method = String(form.get("donation_method") || "transfer").trim();
    const phone = String(form.get("phone") || "").trim();
    const message = String(form.get("message") || "").trim();
    const slip = form.get("slip") as File | null;

    if (!full_name) return bad("กรุณากรอกชื่อ-สกุล");
    const amount = Number(amount_raw);
    if (!Number.isFinite(amount) || amount <= 0) return bad("จำนวนเงินไม่ถูกต้อง");

    let transfer_date = "";
    let channel = "";
    let cash_note = "";

    if (donation_method === "transfer") {
      transfer_date = String(form.get("transfer_date") || "").trim();
      channel = String(form.get("channel") || "").trim();
      if (!transfer_date) return bad("กรุณาเลือกวันที่โอน");
      if (!slip) return bad("กรุณาแนบสลิปการโอน");
    } else {
      transfer_date = String(form.get("donation_date") || "").trim();
      cash_note = String(form.get("cash_note") || "").trim();
      if (!transfer_date) return bad("กรุณาเลือกวันที่บริจาค");
    }

    let slip_path = null;
    if (donation_method === "transfer" && slip) {
      // จำกัดไฟล์
      const maxMB = 5;
      if (slip.size > maxMB * 1024 * 1024) return bad(`ไฟล์สลิปต้องไม่เกิน ${maxMB}MB`);
      const allowed = ["image/jpeg", "image/png", "image/webp"];
      if (!allowed.includes(slip.type)) return bad("รองรับไฟล์ JPG/PNG/WEBP เท่านั้น");

      const supabase = supabaseService();

      // 1) Upload slip to private bucket
      const ext = slip.type === "image/png" ? "png" : slip.type === "image/webp" ? "webp" : "jpg";
      const filename = `donations/${uuidv4()}.${ext}`;
      const arrayBuffer = await slip.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const up = await supabase.storage
        .from("slips")
        .upload(filename, buffer, { contentType: slip.type, upsert: false });

      if (up.error) return bad(`อัปโหลดสลิปล้มเหลว: ${up.error.message}`, 500);
      slip_path = filename;
    }

    const alumni_batch = alumni_batch_raw ? Number(alumni_batch_raw) : null;
    if (alumni_batch_raw && !Number.isInteger(alumni_batch)) return bad("รุ่นศิษย์เก่าต้องเป็นตัวเลข");

    const supabase = supabaseService();

    // 2) Insert donation record
    const insertData: any = {
      full_name,
      alumni_batch,
      donor_type,
      team_name: team_name || null,
      amount,
      transfer_date,
      phone: phone || null,
      message: message || null,
      verified: false,
      publish: true,
      status: "pending",
      // cash_note: donation_method === "cash" ? (cash_note || null) : null, // Commented out until column is added
    };

    // Handle slip_path based on donation method
    if (donation_method === "transfer") {
      insertData.channel = channel || null;
      insertData.slip_path = slip_path;
    } else {
      // For cash donations, use a placeholder value since slip_path might be NOT NULL
      insertData.slip_path = "cash_donation_no_slip";
      insertData.channel = null;
    }

    const ins = await supabase.from("donations").insert(insertData).select("id, status, created_at").single();

    if (ins.error) return bad(`บันทึกรายการล้มเหลว: ${ins.error.message}`, 500);

    return NextResponse.json({ 
      ok: true, 
      ref: ins.data.id, 
      status: ins.data.status,
      message: "ส่งข้อมูลสำเร็จ ✅ กรุณารอแอดมินตรวจสอบยอดก่อน ยอดบริจาคจะไปแสดงบนหน้าเว็บเมื่ออนุมัติแล้วครับ"
    });
  } catch (e: any) {
    return bad(e?.message || "เกิดข้อผิดพลาด", 500);
  }
}
