import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://gold2cash.shop"),
  title: "ทองแลกเงิน Gold2Cash | ราคาทองและเม็ดเงินวันนี้",
  description: "เช็กราคา Gold Spot, Silver Spot ราคาทองและเม็ดเงิน รับซื้อทองหลอม เงินหลอม พร้อมบทวิเคราะห์และเครื่องคำนวณราคา",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/gold2cash-logo.jpg",
    shortcut: "/gold2cash-logo.jpg",
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: "https://gold2cash.shop",
    siteName: "Gold2Cash ทองแลกเงิน",
    title: "Gold2Cash | Price Board ราคาทองและเงินแท่งวันนี้",
    description: "ราคาทองคำแท่ง 96.5% และเงินแท่ง 99.99% พร้อมข้อมูลตลาดและ Trade Diary",
    images: [{ url: "/gold2cash-logo.jpg", width: 320, height: 320, alt: "โลโก้ Gold2Cash" }],
  },
  twitter: {
    card: "summary",
    title: "Gold2Cash | ราคาทองและเงินแท่งวันนี้",
    description: "Price Board ราคาทองคำแท่งและเงินแท่ง พร้อมข้อมูลตลาดล่าสุด",
    images: ["/gold2cash-logo.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
