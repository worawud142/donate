"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Donation = {
  id: string;
  full_name: string;
  alumni_batch: number | null;
  donor_type: string;
  amount: number;
  transfer_date: string;
  channel: string | null;
  phone: string | null;
  message: string | null;
  slip_path: string;
  verified: boolean;
  publish: boolean;
  status: string;
  created_at: string;
  team_name?: string;
};

export default function AdminPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [items, setItems] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Donation | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const router = useRouter();

  async function load() {
    setLoading(true);
    setAuthError(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const sess = sessionData.session;
    if (!sess) {
      router.push("/admin/login");
      return;
    }
    setUserEmail(sess.user.email ?? null);
    setToken(sess.access_token);

    const { data: itemsData, error: itemsError } = await supabase
      .from("donations")
      .select("*")
      .order("created_at", { ascending: false });

    if (itemsError) {
      setAuthError(`ดึงข้อมูลล้มเหลว: ${itemsError.message}`);
    } else {
      setItems(itemsData || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  function applyOptimistic(path: string, body: { id: string; publish?: boolean }) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== body.id) return item;
        if (path.endsWith("/approve")) {
          return { ...item, verified: true, status: "approved" };
        }
        if (path.endsWith("/reject")) {
          return { ...item, verified: false, status: "rejected" };
        }
        if (path.endsWith("/toggle-publish")) {
          return { ...item, publish: !!body.publish };
        }
        return item;
      })
    );
  }

  async function act(path: string, body: { id: string; publish?: boolean }) {
    if (!token) return;
    setActionError(null);
    setPendingId(body.id);
    applyOptimistic(path, body);

    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json?.message || "อัปเดตสถานะไม่สำเร็จ");
      }
      if (json.item) {
        setItems((prev) => prev.map((item) => (item.id === json.item.id ? json.item : item)));
      }
    } catch (error: any) {
      setActionError(error?.message || "อัปเดตสถานะไม่สำเร็จ");
      await load();
    } finally {
      setPendingId(null);
    }
  }

  async function deleteDonation(id: string) {
    if (!confirm("คุณต้องการลบรายการนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้")) return;
    
    setPendingId(id);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "ลบข้อมูลไม่สำเร็จ");
      await load();
    } catch (error: any) {
      setActionError(error?.message || "ลบข้อมูลไม่สำเร็จ");
    } finally {
      setPendingId(null);
    }
  }

  function startEdit(item: Donation) {
    setEditingItem({ ...item });
    setShowEditModal(true);
  }

  function getDonationMethod(item: Donation): string {
    return item.slip_path === "cash_donation_no_slip" ? "เงินสด" : "โอนเงิน";
  }

  async function saveEdit() {
    if (!editingItem || !token) return;
    
    setPendingId(editingItem.id);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/update", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(editingItem),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "อัปเดตข้อมูลไม่สำเร็จ");
      setShowEditModal(false);
      setEditingItem(null);
      await load();
    } catch (error: any) {
      setActionError(error?.message || "อัปเดตข้อมูลไม่สำเร็จ");
    } finally {
      setPendingId(null);
    }
  }

  async function viewSlip(slip_path: string) {
    if (!token) return;
    
    // Check if this is a cash donation (no actual slip)
    if (slip_path === "cash_donation_no_slip") {
      setSlipUrl("cash_donation");
      return;
    }
    
    const res = await fetch("/api/admin/signed-slip", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ slip_path }),
    });
    const json = await res.json();
    if (json.ok) setSlipUrl(json.url);
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 font-sans p-6 md:p-10">
      {/* Decorative blurred blobs */}
      <div className="absolute top-[10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-200/30 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-slate-200/40 blur-[100px] pointer-events-none" />

      <div className="relative max-w-[90rem] mx-auto animate-fade-up">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center rounded-full bg-white px-5 py-2 text-sm font-medium text-slate-600 border border-slate-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:bg-slate-50 hover:text-slate-900 transition-all duration-300"
          >
            ← กลับหน้าแรก
          </Link>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-3xl font-bold text-slate-800 tracking-tight">ระบบแอดมิน (Admin Dashboard)</h1>
            <p className="text-slate-500 mt-2 text-sm">ตรวจสอบและอนุมัติรายการบริจาค</p>
          </div>
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm text-sm text-slate-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {userEmail ? `${userEmail}` : "Not logged in"}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 py-10 px-5 text-slate-500">
            <span className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin" /> กำลังโหลดข้อมูล...
          </div>
        ) : authError ? (
          <div className="rounded-xl bg-red-50 border border-red-100 p-5 text-red-600">
            {authError}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div className="lg:col-span-2 xl:col-span-3 rounded-3xl bg-white/80 backdrop-blur-xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all hover:bg-white/90">
              {actionError && (
                <div className="m-4 rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">
                  {actionError}
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="text-slate-500 bg-slate-50/50 text-sm tracking-wider uppercase">
                    <tr>
                      <th className="p-4 font-medium border-b border-slate-100">ชื่อ</th>
                      <th className="p-4 font-medium border-b border-slate-100 text-center">รุ่น</th>
                      <th className="p-4 font-medium border-b border-slate-100 text-right">ยอด</th>
                      <th className="p-4 font-medium border-b border-slate-100 text-center">ช่องทาง</th>
                      <th className="p-4 font-medium border-b border-slate-100 text-center">สถานะ</th>
                      <th className="p-4 font-medium border-b border-slate-100 text-left">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80">
                    {items.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="font-medium text-slate-800">{d.full_name}</div>
                        </td>
                        <td className="p-4 text-center text-slate-600">{d.alumni_batch ?? "-"}</td>
                        <td className="p-4 text-right">
                          <span className="font-semibold text-slate-800 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                            {Number(d.amount).toLocaleString()}
                          </span>
                        </td>
                        <td className="p-4 text-center text-slate-600">
                          {d.channel || (d.slip_path === "cash_donation_no_slip" ? "เงินสด" : "-")}
                        </td>
                        <td className="p-4 text-center">
                          {d.status === 'approved' ? (
                            <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">อนุมัติแล้ว</span>
                          ) : d.status === 'rejected' ? (
                            <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-700">ปฏิเสธ</span>
                          ) : (
                            <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">รอตรวจสอบ</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm disabled:opacity-50 transition-colors"
                              disabled={pendingId === d.id}
                              onClick={() => viewSlip(d.slip_path)}
                            >
                              ดูสลิป
                            </button>
                            <button
                              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 shadow-sm disabled:opacity-50 transition-colors"
                              disabled={pendingId === d.id}
                              onClick={() => act("/api/admin/approve", { id: d.id })}
                            >
                              Approve
                            </button>
                            <button
                              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 shadow-sm disabled:opacity-50 transition-colors"
                              disabled={pendingId === d.id}
                              onClick={() => act("/api/admin/reject", { id: d.id })}
                            >
                              Reject
                            </button>
                            <button
                              className={`px-3 py-1.5 text-xs font-semibold rounded-md shadow-sm disabled:opacity-50 transition-colors ${d.publish ? 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100' : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'}`}
                              disabled={pendingId === d.id}
                              onClick={() => act("/api/admin/toggle-publish", { id: d.id, publish: !d.publish })}
                            >
                              Publish: {d.publish ? 'ON' : 'OFF'}
                            </button>
                            <button
                              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 shadow-sm disabled:opacity-50 transition-colors"
                              disabled={pendingId === d.id}
                              onClick={() => startEdit(d)}
                            >
                              แก้ไข
                            </button>
                            <button
                              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 shadow-sm disabled:opacity-50 transition-colors"
                              disabled={pendingId === d.id}
                              onClick={() => deleteDonation(d.id)}
                            >
                              ลบ
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 transition-all hover:bg-white/90">
              <div className="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2">
                <span className="text-xl">📄</span> ดูสลิป (slip)
              </div>
              {slipUrl ? (
                slipUrl === "cash_donation" ? (
                  <div className="h-64 rounded-xl border-2 border-dashed border-green-200 bg-green-50 flex items-center justify-center text-green-600 text-sm p-6 text-center">
                    <div>
                      <div className="text-2xl mb-2">💰</div>
                      <div className="font-semibold">บริจาคเงินสด</div>
                      <div className="text-xs mt-1">ไม่มีสลิปการโอนเงิน</div>
                    </div>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 relative group">
                    <img alt="slip" src={slipUrl} className="w-full object-contain max-h-[500px]" />
                    <a className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium backdrop-blur-sm" href={slipUrl} target="_blank">
                      เปิดขยายเต็มจอ ↗
                    </a>
                  </div>
                )
              ) : (
                <div className="h-64 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 text-sm p-6 text-center">
                  คลิกปุ่ม &quot;ดูสลิป&quot; จากรายการทางซ้ายมือ<br />เพื่อนำมาแสดงผลที่นี่
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-4">แก้ไขข้อมูลการบริจาค</h3>
            
            {/* Display original info */}
            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
              <div className="text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>ประเภทการบริจาค:</span>
                  <span className="font-semibold">{getDonationMethod(editingItem)}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>สถานะ:</span>
                  <span className="font-semibold">
                    {editingItem.status === 'approved' ? 'อนุมัติแล้ว' : 
                     editingItem.status === 'rejected' ? 'ปฏิเสธ' : 'รอตรวจสอบ'}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>การเผยแพร่:</span>
                  <span className="font-semibold">{editingItem.publish ? 'เผยแพร่' : 'ไม่เผยแพร่'}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-600">ชื่อ-สกุล</label>
                <input
                  type="text"
                  value={editingItem.full_name}
                  onChange={(e) => setEditingItem({ ...editingItem, full_name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-slate-600">รุ่นศิษย์เก่า</label>
                <input
                  type="number"
                  value={editingItem.alumni_batch || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, alumni_batch: e.target.value ? Number(e.target.value) : null })}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-slate-600">ประเภทผู้บริจาค</label>
                <select
                  value={editingItem.donor_type}
                  onChange={(e) => setEditingItem({ ...editingItem, donor_type: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                >
                  <option value="alumni">ศิษย์เก่า</option>
                  <option value="parent">ผู้ปกครอง</option>
                  <option value="organization">หน่วยงาน/ห้างร้าน</option>
                  <option value="public">ประชาชนทั่วไป</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-slate-600">ทีม/แก๊ง (ถ้ามี)</label>
                <input
                  type="text"
                  value={editingItem.team_name || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, team_name: e.target.value })}
                  placeholder="เช่น ทีมฟุตบอล, คณะวิศวกรรม, บริษัท ABC"
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-slate-600">จำนวนเงิน (บาท)</label>
                <input
                  type="number"
                  value={editingItem.amount}
                  onChange={(e) => setEditingItem({ ...editingItem, amount: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-slate-600">วันที่โอน/บริจาค</label>
                <input
                  type="date"
                  value={editingItem.transfer_date}
                  onChange={(e) => setEditingItem({ ...editingItem, transfer_date: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-slate-600">ช่องทางโอน</label>
                <input
                  type="text"
                  value={editingItem.channel || (editingItem.slip_path === "cash_donation_no_slip" ? "เงินสด" : "")}
                  onChange={(e) => setEditingItem({ ...editingItem, channel: e.target.value })}
                  placeholder="เช่น ธนาคารกสิกรไทย / พร้อมเพย์"
                  disabled={editingItem.slip_path === "cash_donation_no_slip"}
                  className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 ${
                    editingItem.slip_path === "cash_donation_no_slip" 
                      ? "bg-slate-100 text-slate-500 cursor-not-allowed" 
                      : "bg-slate-50"
                  }`}
                />
                {editingItem.slip_path === "cash_donation_no_slip" && (
                  <p className="text-xs text-slate-500 mt-1">การบริจาคเงินสดไม่มีช่องทางโอน</p>
                )}
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-slate-600">เบอร์ติดต่อ</label>
                <input
                  type="text"
                  value={editingItem.phone || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, phone: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-slate-600">ข้อความถึงโรงเรียน</label>
                <textarea
                  value={editingItem.message || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, message: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={saveEdit}
                disabled={pendingId === editingItem.id}
                className="flex-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-60 disabled:cursor-not-allowed py-2 font-medium transition-colors"
              >
                {pendingId === editingItem.id ? "กำลังบันทึก..." : "บันทึก"}
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingItem(null);
                }}
                className="flex-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 font-medium transition-colors"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
