import type { Metadata } from "next";
import { Geist, Geist_Mono, Caprasimo, Figtree } from "next/font/google";
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

// Design-system fonts: Caprasimo for figures/titles, Figtree for body.
const caprasimo = Caprasimo({
  weight: "400",
  variable: "--font-heading",
  subsets: ["latin"],
});

const figtree = Figtree({
  variable: "--font-body",
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
  themeColor: "#C67139",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${caprasimo.variable} ${figtree.variable} h-full antialiased`}
      style={{ colorScheme: "light" }}
    >
      <body
        className="min-h-full flex flex-col text-[#402310]"
        style={{
          fontFamily: "var(--font-body), system-ui, sans-serif",
          background: "var(--color-bg)",
        }}
      >
        <Providers>{children}</Providers>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
