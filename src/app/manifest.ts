import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dairy Ledger",
    short_name: "Dairy Ledger",
    description: "Track milk deliveries, dues, and daily customers",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#E8D7B0",
    theme_color: "#9D6638",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
