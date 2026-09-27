import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BAYT-X — من أول البحث لحد المفتاح",
  description: "منصة عقارية متكاملة للسوق المصري",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
