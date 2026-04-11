import type { Metadata } from "next";
import "./globals.css";
import { SANS_FONT_STACK } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "โดมอเนกประสงค์ โรงเรียนบ้านขัวก่าย",
  description: "ระบบบริจาคและติดตามยอดบริจาคเพื่อสร้างโดมอเนกประสงค์",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className="bg-slate-50 text-slate-900 selection:bg-slate-200 selection:text-slate-900"
        style={{ fontFamily: SANS_FONT_STACK, fontWeight: 500 }}
      >
        {children}
      </body>
    </html>
  );
}
