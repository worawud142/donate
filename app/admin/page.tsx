"use client";

import { createClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getPublicSupabaseEnv } from "@/lib/supabase-config";

const supabaseEnv = getPublicSupabaseEnv();
const supabase = supabaseEnv ? createClient(supabaseEnv.url, supabaseEnv.anonKey) : null;

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
  const [slipLoading, setSlipLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<Donation | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [approvalItem, setApprovalItem] = useState<Donation | null>(null);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const router = useRouter();
  const slipUrlCache = useRef<Map<string, { url: string; expiresAt: number }>>(new Map());
  const slipRequestCache = useRef<Map<string, Promise<string>>>(new Map());
  const slipRequestSeq = useRef(0);
  const SLIP_CACHE_TTL_MS = 4 * 60 * 1000;

  async function resolveSession() {
    if (!supabase) return null;

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) return null;

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session?.expires_at ?? 0;

    if (session?.access_token && expiresAt > now + 60) {
      return { session, token: session.access_token };
    }

    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      return session.access_token ? { session, token: session.access_token } : null;
    }

    const nextSession = data.session ?? session;
    const nextToken = nextSession?.access_token ?? null;
    if (!nextToken) return null;
    return { session: nextSession, token: nextToken };
  }

  async function load() {
    setAuthError(null);
    if (items.length === 0) {
      setLoading(true);
    }

    if (!supabase) {
      setAuthError("ยังไม่มีค่าการเชื่อมต่อ Supabase สำหรับหน้าแอดมิน");
      setLoading(false);
      return;
    }

    const auth = await resolveSession();
    if (!auth) {
      router.push("/admin/login");
      return;
    }
    setUserEmail(auth.session.user.email ?? null);
    setToken(auth.token);

    try {
      const res = await fetch("/api/admin/list", {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json?.message || "ดึงข้อมูลล้มเหลว");
      }
      setItems(json.items || []);
    } catch (error: any) {
      setAuthError(`ดึงข้อมูลล้มเหลว: ${error?.message || "ไม่สามารถโหลดรายการได้"}`);
    }
    setLoading(false);
  }

  const getSignedSlipUrl = useCallback(async (slip_path: string) => {
    const cached = slipUrlCache.current.get(slip_path);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.url;
    }

    const pending = slipRequestCache.current.get(slip_path);
    if (pending) {
      return pending;
    }

    const promise = (async () => {
      if (!supabase) {
        throw new Error("ยังไม่มีค่าการเชื่อมต่อ Supabase สำหรับหน้าแอดมิน");
      }

      const auth = await resolveSession();
      if (!auth) {
        throw new Error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
      }
      setToken(auth.token);

      const res = await fetch("/api/admin/signed-slip", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ slip_path }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok || !json.url) {
        throw new Error(json?.message || "ดึงสลิปไม่สำเร็จ");
      }

      slipUrlCache.current.set(slip_path, {
        url: json.url,
        expiresAt: Date.now() + SLIP_CACHE_TTL_MS,
      });

      return json.url as string;
    })().finally(() => {
      slipRequestCache.current.delete(slip_path);
    });

    slipRequestCache.current.set(slip_path, promise);
    return promise;
  }, [resolveSession, setToken]);

  const prefetchSlip = useCallback((slip_path: string) => {
    if (slip_path === "cash_donation_no_slip") return;
    void getSignedSlipUrl(slip_path).catch(() => undefined);
  }, [getSignedSlipUrl]);

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    router.prefetch("/admin/board");
    router.prefetch("/admin/ecard");
  }, [router]);

  function applyOptimistic(path: string, body: { id: string; publish?: boolean }) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== body.id) return item;
        if (path.endsWith("/approve")) {
          return { ...item, verified: true, status: "approved", publish: true };
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
    setActionError(null);
    setPendingId(body.id);
    applyOptimistic(path, body);

    try {
      if (!supabase) {
        throw new Error("ยังไม่มีค่าการเชื่อมต่อ Supabase สำหรับหน้าแอดมิน");
      }

      const auth = await resolveSession();
      if (!auth) {
        throw new Error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
      }
      setToken(auth.token);

      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok && json?.message === "Auth session missing!") {
        const refreshed = await resolveSession();
        if (refreshed && refreshed.token !== auth.token) {
          setToken(refreshed.token);
          const retry = await fetch(path, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${refreshed.token}` },
            body: JSON.stringify(body),
          });
          const retryJson = await retry.json();
          if (retry.ok && retryJson.ok) {
            if (retryJson.item) {
              setItems((prev) => prev.map((item) => (item.id === retryJson.item.id ? retryJson.item : item)));
            }
            return;
          }
          throw new Error(retryJson?.message || "อัปเดตสถานะไม่สำเร็จ");
        }
      }
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
      if (!supabase) {
        throw new Error("ยังไม่มีค่าการเชื่อมต่อ Supabase สำหรับหน้าแอดมิน");
      }

      const auth = await resolveSession();
      if (!auth) {
        throw new Error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
      }
      setToken(auth.token);

      const res = await fetch("/api/admin/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
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

  async function confirmApprove() {
    if (!approvalItem) return;

    if (!reviewConfirmed) {
      setActionError("กรุณายืนยันว่าตรวจสอบยอดเงินในสลิปแล้ว");
      return;
    }

    const item = approvalItem;
    setApprovalItem(null);
    setReviewConfirmed(false);
    await act("/api/admin/approve", { id: item.id });
  }

  async function saveEdit() {
    if (!editingItem) return;

    setPendingId(editingItem.id);
    setActionError(null);
    try {
      if (!supabase) {
        throw new Error("ยังไม่มีค่าการเชื่อมต่อ Supabase สำหรับหน้าแอดมิน");
      }

      const auth = await resolveSession();
      if (!auth) {
        throw new Error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
      }
      setToken(auth.token);

      const res = await fetch("/api/admin/update", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
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

  const viewSlip = useCallback(async (slip_path: string) => {
    // Check if this is a cash donation (no actual slip)
    if (slip_path === "cash_donation_no_slip") {
      setSlipLoading(false);
      setSlipUrl("cash_donation");
      return;
    }

    const requestId = ++slipRequestSeq.current;
    setSlipLoading(true);
    setSlipUrl(null);

    try {
      const url = await getSignedSlipUrl(slip_path);
      if (slipRequestSeq.current === requestId) {
        setSlipUrl(url);
        setSlipLoading(false);
      }
    } catch (error: any) {
      if (slipRequestSeq.current === requestId) {
        setActionError(error?.message || "ดึงสลิปไม่สำเร็จ");
        setSlipLoading(false);
      }
    }
  }, [getSignedSlipUrl]);

  async function handleLogout() {
    if (!confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) return;
    if (!supabase) {
      router.push("/admin/login");
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("เกิดข้อผิดพลาดในการออกจากระบบ: " + error.message);
    } else {
      router.push("/admin/login");
    }
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
          <div className="flex flex-wrap items-center justify-start md:justify-end gap-3">
            <Link
              href="/admin/board"
              className="inline-flex min-w-[160px] items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-full shadow-sm text-sm font-semibold transition-colors ring-1 ring-emerald-500/20"
            >
              <span className="text-lg">📺</span> Board
            </Link>
            <Link
              href="/admin/ecard"
              className="inline-flex min-w-[160px] items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full shadow-sm text-sm font-semibold transition-colors"
            >
              <span className="text-lg">🖼️</span> สร้าง E-Card ขอบคุณ
            </Link>
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm text-sm text-slate-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {userEmail ? `${userEmail}` : "Not logged in"}
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 bg-white hover:bg-rose-50 text-rose-600 px-4 py-2 rounded-full border border-rose-100 shadow-sm text-sm font-semibold transition-all duration-300"
            >
              <span>🚪</span> ออกจากระบบ
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div className="lg:col-span-2 xl:col-span-3 rounded-3xl bg-white/80 backdrop-blur-xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
              <div className="overflow-x-auto animate-pulse">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="text-slate-500 bg-slate-50/50 text-sm tracking-wider uppercase">
                    <tr>
                      <th className="p-4 font-medium border-b border-slate-100">ชื่อ</th>
                      <th className="p-4 font-medium border-b border-slate-100 text-center">รุ่น</th>
                      <th className="p-4 font-medium border-b border-slate-100 text-right">ยอด</th>
                      <th className="p-4 font-medium border-b border-slate-100 text-center">ช่องทาง</th>
                      <th className="p-4 font-medium border-b border-slate-100 text-center">สถานะ</th>
                      <th className="p-4 font-medium border-b border-slate-100 text-left whitespace-nowrap">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <tr key={idx}>
                        <td className="p-4"><div className="h-4 w-40 rounded bg-slate-200" /></td>
                        <td className="p-4 text-center"><div className="mx-auto h-4 w-10 rounded bg-slate-200" /></td>
                        <td className="p-4 text-right"><div className="ml-auto h-4 w-24 rounded bg-slate-200" /></td>
                        <td className="p-4 text-center"><div className="mx-auto h-4 w-20 rounded bg-slate-200" /></td>
                        <td className="p-4 text-center"><div className="mx-auto h-5 w-24 rounded-full bg-slate-200" /></td>
                        <td className="p-4"><div className="h-4 w-56 rounded bg-slate-200" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
              <div className="h-5 w-32 rounded bg-slate-200 animate-pulse mb-4" />
              <div className="h-64 rounded-xl border border-slate-200 bg-slate-100 animate-pulse" />
            </div>
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
                        <td className="py-4 pl-4 pr-2 align-top">
                          <div className="inline-flex min-w-max flex-nowrap items-center gap-0.5 whitespace-nowrap">
                            <button
                              className="shrink-0 px-[9px] py-1 text-[11px] font-semibold rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm disabled:opacity-50 transition-colors"
                              disabled={pendingId === d.id}
                              onMouseEnter={() => prefetchSlip(d.slip_path)}
                              onFocus={() => prefetchSlip(d.slip_path)}
                              onClick={() => viewSlip(d.slip_path)}
                            >
                              ดูสลิป
                            </button>
                            <button
                              className="shrink-0 px-[9px] py-1 text-[11px] font-semibold rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 shadow-sm disabled:opacity-50 transition-colors"
                              disabled={pendingId === d.id}
                              onClick={() => {
                                setActionError(null);
                                setApprovalItem(d);
                                setReviewConfirmed(false);
                              }}
                            >
                              Approve
                            </button>
                            <button
                              className="shrink-0 px-[9px] py-1 text-[11px] font-semibold rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 shadow-sm disabled:opacity-50 transition-colors"
                              disabled={pendingId === d.id}
                              onClick={() => act("/api/admin/reject", { id: d.id })}
                            >
                              Reject
                            </button>
                            <button
                              className={`shrink-0 px-[9px] py-1 text-[11px] font-semibold rounded-md shadow-sm disabled:opacity-50 transition-colors ${d.publish ? 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100' : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'}`}
                              disabled={pendingId === d.id}
                              onClick={() => act("/api/admin/toggle-publish", { id: d.id, publish: !d.publish })}
                              title={d.publish ? "เผยแพร่" : "ไม่เผยแพร่"}
                            >
                              Publish: {d.publish ? 'ON' : 'OFF'}
                            </button>
                            <button
                              className="shrink-0 px-[9px] py-1 text-[11px] font-semibold rounded-md bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 shadow-sm disabled:opacity-50 transition-colors"
                              disabled={pendingId === d.id}
                              onClick={() => startEdit(d)}
                            >
                              แก้ไข
                            </button>
                            <button
                              className="shrink-0 px-[9px] py-1 text-[11px] font-semibold rounded-md bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 shadow-sm disabled:opacity-50 transition-colors"
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
              {slipLoading ? (
                <div className="h-64 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500 text-sm p-6 text-center">
                  <div>
                    <div className="mx-auto mb-3 h-10 w-10 rounded-full border-4 border-slate-200 border-t-sky-500 animate-spin" />
                    <div className="font-medium">กำลังโหลดสลิป...</div>
                    <div className="mt-1 text-xs text-slate-400">ระบบกำลังเตรียมภาพขนาดย่อสำหรับแสดงผล</div>
                  </div>
                </div>
              ) : slipUrl ? (
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
                    <img
                      alt="slip"
                      src={slipUrl}
                      className="w-full object-contain max-h-[500px]"
                    />
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

      {/* Approve Confirmation Modal */}
      {approvalItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-800 mb-2">ตรวจสอบยอดก่อนอนุมัติ</h3>
            <p className="text-sm text-slate-500 mb-4">
              กรุณายืนยันยอดเงินจากสลิปให้ตรงกับรายการ ก่อนกดอนุมัติ
            </p>

            <div className="mb-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-sm text-slate-600">
              <div className="flex justify-between gap-4">
                <span>ชื่อผู้บริจาค:</span>
                <span className="font-semibold text-slate-800 text-right">{approvalItem.full_name}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>ยอดในรายการ:</span>
                <span className="font-semibold text-slate-800">{Number(approvalItem.amount).toLocaleString()} บาท</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>วันที่:</span>
                <span className="font-semibold text-slate-800">{approvalItem.transfer_date}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-800">
                ยอดที่บันทึกไว้ในรายการ: <span className="font-semibold">{Number(approvalItem.amount).toLocaleString()} บาท</span>
              </div>
              <div>
                <label className="flex items-start gap-3 text-sm text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={reviewConfirmed}
                    onChange={(e) => setReviewConfirmed(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    ตรวจสอบยอดเงินจากสลิปและข้อมูลรายการแล้ว และยอดตรงกันก่อนอนุมัติ
                  </span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={confirmApprove}
                  disabled={pendingId === approvalItem.id || !reviewConfirmed}
                  className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60 disabled:cursor-not-allowed py-2 font-medium transition-colors"
                >
                  {pendingId === approvalItem.id ? "กำลังอนุมัติ..." : "ตรวจยอดแล้วและอนุมัติ"}
                </button>
                <button
                  onClick={() => {
                    setApprovalItem(null);
                    setReviewConfirmed(false);
                  }}
                  className="flex-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 font-medium transition-colors"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 ${editingItem.slip_path === "cash_donation_no_slip"
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
