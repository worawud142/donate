import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";

const prompt = Prompt({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
});

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
      <body className={`${prompt.className} antialiased bg-slate-50 text-slate-900 selection:bg-slate-200 selection:text-slate-900`}>{children}</body>
    </html>
  );
}
