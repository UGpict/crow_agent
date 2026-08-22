import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "カラス（Crow）— 着手前ダブルチェック",
  description:
    "「いつも通り」の過信による再発ミスを、着手前に見抜いて指摘するダブルチェックAI。",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
