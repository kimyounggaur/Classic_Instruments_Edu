import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "레슨 디자이너 | 음악 전자도서관",
  description: "교재에서 실습까지, 음악 수업의 모든 순간을 연결합니다. 14종 클래식 악기 전자교재와 음악 실습 앱.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
