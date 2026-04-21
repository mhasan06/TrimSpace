import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import NavHeader from "@/components/NavHeader";
import Providers from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

export const metadata: Metadata = {
  title: "TrimSpace | Modern Barbering SaaS",
  description: "Identity-first barbershop booking platform.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TrimSpace",
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <NavHeader />
          {children}
          <div style={{ position: 'fixed', bottom: '10px', right: '10px', fontSize: '10px', opacity: 0.2, zIndex: 9999, pointerEvents: 'none', color: 'white' }}>
            BUILD V2.1 - ACTIVE
          </div>
        </Providers>
      </body>
    </html>
  );
}
