import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ทองแลกเงิน Gold2Cash | ราคาทองและเม็ดเงินวันนี้",
  description: "เช็กราคา Gold Spot, Silver Spot ราคาทองและเม็ดเงิน รับซื้อทองหลอม เงินหลอม พร้อมบทวิเคราะห์และเครื่องคำนวณราคา",
  other: {
    "codex-preview": "development",
  },
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
    <html lang="th">
      <body className={`${geistSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
