import type { Metadata } from "next";
import "@/components/prototype/prototype.css";
import "@/components/prototype/classical-theme.css";

export const metadata: Metadata = {
  title: "레슨 디자이너 | 음악 전자도서관",
  description:
    "바이올린·첼로·플루트·클라리넷 수업을 준비하는 시연용 전자도서관. 책장, 구조화 단원, 수업안, 권리와 검수 흐름.",
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
