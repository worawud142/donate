"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(pathname === "/admin/login");

  useEffect(() => {
    let alive = true;

    async function check() {
      if (pathname === "/admin/login") {
        if (alive) setReady(true);
        return;
      }

      setReady(false);
      const { data } = await supabase.auth.getSession();
      if (!alive) return;

      if (!data.session) {
        router.replace("/admin/login");
        return;
      }

      setReady(true);
    }

    check();

    return () => {
      alive = false;
    };
  }, [pathname, router]);

  if (!ready) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  return children;
}
