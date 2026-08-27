import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Cache visited pages in the client Router Cache so moving between app
    // screens (Home → Daily, etc.) is instant instead of re-fetching from the
    // server every time. Our mutations call router.refresh(), which clears
    // this cache, so the user never sees stale numbers after a change.
    staleTimes: {
      dynamic: 60,
      static: 300,
    },
  },
};

export default nextConfig;
