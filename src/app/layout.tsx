import type { Metadata } from "next";
import { Kanit, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const kanit = Kanit({
  variable: "--font-kanit",
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["thai", "latin"],
});

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto",
  weight: ["400", "500", "600", "700"],
  subsets: ["thai", "latin"],
});

export const metadata: Metadata = {
  title: "LrapX Store — ร้านขายไอดีเกมและเติมเกมออนไลน์",
  description:
    "ศูนย์รวมไอดีเกมสำเร็จรูป Free Fire, Roblox และบริการเติมเกมราคาดี ส่งไว ปลอดภัย มีประกัน เปิดให้บริการ 24 ชั่วโมง",
  keywords: ["LrapX Store", "ไอดีเกม", "เติมเกม", "Free Fire", "Roblox", "Robux", "เพชร Free Fire", "Gift Game Pass"],
  authors: [{ name: "LrapX Store" }],
  icons: {
    icon: "/images/logo.png",
  },
  openGraph: {
    title: "LrapX Store — ร้านขายไอดีเกมและเติมเกมออนไลน์",
    description: "ไอดีเกมคุณภาพ เติมเกมราคาดี ส่งไวปลอดภัย มีประกัน",
    siteName: "LrapX Store",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning className="dark">
      <body
        className={`${kanit.variable} ${notoSansThai.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
