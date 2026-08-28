import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dairy Ledger",
  description: "Track milk deliveries, dues, and customer trust",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Dairy Ledger", statusBarStyle: "default" },
  icons: { apple: "/apple-touch-icon.png" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  // Lock zoom: no pinch-zoom, no double-tap zoom, and no iOS auto-zoom when
  // focusing an input.
  maximumScale: 1,
  userScalable: false,
  themeColor: "#9D6638",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ colorScheme: "light" }}
    >
      <body className="min-h-full flex flex-col bg-[#E8D7B0] text-[#4E220F]">
        <Providers>{children}</Providers>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
