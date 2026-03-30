"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(pathname === "/admin/login");
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let alive = true;

    async function check() {
      if (pathname === "/admin/login") {
        if (alive) setReady(true);
        return;
      }

      if (session) {
        if (alive) setReady(true);
        return;
      }

      setReady(false);
      const { data } = await supabase.auth.getSession();
      if (!alive) return;

      if (!data.session) {
        setSession(null);
        router.replace("/admin/login");
        return;
      }

      setSession(data.session);
      setReady(true);
    }

    check();

    return () => {
      alive = false;
    };
  }, [pathname, router, session]);

  if (!ready) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  return children;
}
