import type { Metadata } from "next";
import { Suspense } from "react";
import { Caprasimo, Figtree } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { AppSplash } from "@/components/AppSplash";
import { getTheme } from "@/lib/theme";

// Design-system fonts: Caprasimo for figures/titles, Figtree for body.
// (Geist / Geist Mono were removed — the design never rendered them.)
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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const theme = await getTheme();
  return (
    <html
      lang="en"
      data-theme={theme}
      className={`${caprasimo.variable} ${figtree.variable} h-full antialiased`}
      style={{ colorScheme: theme }}
    >
      <body
        className="min-h-full flex flex-col"
        style={{
          fontFamily: "var(--font-body), system-ui, sans-serif",
          background: "var(--color-bg)",
          color: "var(--foreground)",
        }}
      >
        <Providers>
          {/* The (app) layout awaits auth (a DB hit). Suspending
              here lets the splash stream first on a cold load, so the user sees
              the animation instead of a blank page while the server wakes. */}
          <Suspense fallback={<AppSplash />}>{children}</Suspense>
        </Providers>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
