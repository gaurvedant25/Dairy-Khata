"use client";

import { useRouter } from "next/navigation";
import type { Theme } from "@/lib/theme";

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

export function ThemeSwitcher({
  current,
  label,
  lightLabel,
  darkLabel,
}: {
  current: Theme;
  label: string;
  lightLabel: string;
  darkLabel: string;
}) {
  const router = useRouter();

  function change(theme: Theme) {
    // Persist for a year; the root layout reads this cookie to set data-theme.
    document.cookie = `theme=${theme}; path=/; max-age=31536000`;
    // Update immediately for a snappy switch, then refresh server components.
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    router.refresh();
  }

  const options: { value: Theme; text: string; icon: React.ReactNode }[] = [
    { value: "light", text: lightLabel, icon: <SunIcon /> },
    { value: "dark", text: darkLabel, icon: <MoonIcon /> },
  ];

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[13px] font-semibold text-[var(--color-accent-900)]">{label}</span>
      <div className="flex gap-2.5">
        {options.map((o) => {
          const on = current === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => change(o.value)}
              aria-pressed={on}
              className="flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-center text-[13.5px] font-semibold transition active:scale-[0.98]"
              style={
                on
                  ? {
                      background: "var(--color-accent-600)",
                      color: "var(--cream-on-accent)",
                      border: "1.5px solid var(--color-accent-600)",
                    }
                  : {
                      background: "var(--color-bg)",
                      color: "var(--color-neutral-700)",
                      border: "1.5px solid var(--color-neutral-300)",
                    }
              }
            >
              {o.icon}
              {o.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
