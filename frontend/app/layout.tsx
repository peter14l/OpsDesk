import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpsDesk - TBO Next-Gen B2B Travel Operations Desk",
  description: "B2B Travel Operations Ticketing Platform with Travel-Aware SLAs and Context Linkage",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-sky-100 selection:text-sky-900">
        {children}
      </body>
    </html>
  );
}
