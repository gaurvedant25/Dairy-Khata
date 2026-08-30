// Full-screen loading splash shown while the app layout is still resolving on
// the server (cold serverless function + Neon waking up). It lives at the ROOT
// layout — which awaits nothing — so it streams to the browser immediately and
// covers the cold-start wait with a branded animation instead of a blank page.
// Pure CSS, no hooks/JS, so it animates before any hydration.
export function AppSplash() {
  return (
    <div
      className="dl-splash fixed inset-0 z-50 flex flex-col items-center justify-center gap-6"
      style={{ background: "var(--color-bg)" }}
      aria-label="Loading"
      role="status"
    >
      <div className="flex items-center gap-2.5">
        <span
          className="inline-block h-3 w-3 shrink-0 rounded-full"
          style={{ background: "var(--color-accent-500)" }}
          aria-hidden
        />
        <span className="font-heading text-[26px] tracking-tight text-[var(--color-accent-900)]">
          Dairy Ledger
        </span>
      </div>

      <div className="flex items-center gap-2" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="dl-splash-dot inline-block h-2.5 w-2.5 rounded-full"
            style={{
              background: "var(--color-accent)",
              animationDelay: `${i * 0.16}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
