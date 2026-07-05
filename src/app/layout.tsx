import type { Metadata } from "next";
import { Raleway, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
});

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-noto-sans-kr",
});

export const metadata: Metadata = {
  title: "StellaNova Days",
  description: "스텔라노바의 매일을 기록하다 — AI 기반 일일 진척 저장소",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${raleway.variable} ${notoSansKR.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white font-sans">
        {children}
      </body>
    </html>
  );
}