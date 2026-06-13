import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import NavSidebar from "@/components/NavSidebar";
import SplashScreen from "@/components/SplashScreen";
import PWAInstall from "@/components/pwa/PWAInstall";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FC Krabpull",
  description: "Zaalvoetbal team management",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  manifest: "/manifest.webmanifest",
  themeColor: "#12060a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-screen">
        <SplashScreen />
        <PWAInstall />
        <NavSidebar />

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile top bar */}
          <header
            className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-20"
            style={{
              background: "oklch(1 0 0 / 8%)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderBottom: "1px solid oklch(1 0 0 / 10%)",
            }}
          >
            <Link href="/" className="font-semibold text-white">FC Krabpull</Link>
            <div className="flex gap-3 text-sm">
              <Link href="/admin" className="text-white/70 hover:text-white">Admin</Link>
              <Link href="/login" className="text-white/70 hover:text-white">Login</Link>
            </div>
          </header>
          <main className="flex-1 px-4 md:px-8 py-6 md:py-8 max-w-6xl w-full mx-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
