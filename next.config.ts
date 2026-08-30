import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Cache visited pages in the client Router Cache so moving between app
    // screens (Home → Daily, etc.) is instant instead of re-fetching from the
    // server every time. Our mutations call router.refresh(), which clears
    // this cache, so the user never sees stale numbers after a change.
    // Keep visited pages in the client Router Cache (RAM) longer so moving
    // between screens is instant and doesn't re-hit the server. Mutations call
    // router.refresh(), which clears the cache, so numbers are never stale
    // after a change the user made.
    staleTimes: {
      dynamic: 300,
      static: 600,
    },
  },
};

export default nextConfig;
