// lib/supabase-server.ts
import { createClient } from "@supabase/supabase-js";
import { getServiceSupabaseEnv } from "./supabase-config";

export function supabaseService() {
  const env = getServiceSupabaseEnv();
  if (!env) {
    throw new Error("Missing Supabase server environment variables.");
  }

  return createClient(env.url, env.serviceKey, {
    auth: { persistSession: false },
  });
}

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}
