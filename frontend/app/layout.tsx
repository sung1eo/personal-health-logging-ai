import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import AppHeader from "@/components/AppHeader";
import FontSizeProvider from "@/components/FontSizeProvider";

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto",
});

export const metadata: Metadata = {
  title: "헬스로그",
  description: "AI 건강 기록 도우미",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSansKR.variable} h-full`}>
      <body
        className="h-full flex flex-col antialiased"
        style={{ fontFamily: "var(--font-noto), sans-serif", background: "var(--bg)" }}
      >
        <FontSizeProvider>
          <AppHeader />
          <main className="flex-1 overflow-hidden flex flex-col">{children}</main>
          <BottomNav />
        </FontSizeProvider>
      </body>
    </html>
  );
}
