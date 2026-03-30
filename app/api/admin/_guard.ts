// app/api/admin/_guard.ts
import { createClient } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/supabase-server";
import { getServiceSupabaseEnv } from "@/lib/supabase-config";

export function supabaseAuthFromRequest(req: Request) {
  // อ่าน token จาก Authorization: Bearer <access_token>
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  const env = getServiceSupabaseEnv();
  if (!env) {
    return { supabase: null, token };
  }

  const supabase = createClient(
    env.url,
    env.serviceKey, // service role เพื่อทำงาน admin
    { auth: { persistSession: false } }
  );

  return { supabase, token };
}

export async function requireAdmin(req: Request) {
  const { supabase, token } = supabaseAuthFromRequest(req);
  if (!supabase) return { ok: false as const, status: 500, message: "Supabase server configuration is missing." };
  if (!token) return { ok: false as const, status: 401, message: "No token" };

  const { data, error } = await supabase.auth.getUser(token);
  if (error) return { ok: false as const, status: 401, message: error.message };

  const email = data.user?.email || null;
  if (!isAdminEmail(email)) return { ok: false as const, status: 403, message: "Not admin" };

  return { ok: true as const, supabase, user: data.user };
}
