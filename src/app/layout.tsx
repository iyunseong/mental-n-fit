// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "mental-n-fit - 당신만의 MetaType 발견",
  description: "과학적 근거 기반 MetaType 16 진단으로 개인 맞춤 식단과 운동을 추천받으세요",
  keywords: "MetaType, 건강, 식단, 운동, 생체리듬, 스트레스, 장내미생물",
  authors: [{ name: "mental-n-fit" }],
  openGraph: {
    title: "mental-n-fit - 당신만의 MetaType 발견",
    description: "과학적 근거 기반 MetaType 16 진단으로 개인 맞춤 식단과 운동을 추천받으세요",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <NavBar />
        {children}
      </body>
    </html>
  );
}
