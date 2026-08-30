"use client";

import { useRouter } from "next/navigation";
import { LANGS, type Lang } from "@/lib/i18n";

export function LanguageSwitcher({ current, label }: { current: Lang; label: string }) {
  const router = useRouter();

  function change(lang: string) {
    // Persist for a year; server components read this cookie to pick the language.
    document.cookie = `lang=${lang}; path=/; max-age=31536000`;
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[13px] font-semibold text-[var(--color-accent-900)]">{label}</span>
      <div className="flex gap-2.5">
        {LANGS.map((l) => {
          const on = current === l.value;
          return (
            <button
              key={l.value}
              type="button"
              onClick={() => change(l.value)}
              aria-pressed={on}
              className="flex-1 rounded-full py-3 text-center text-[13.5px] font-semibold transition active:scale-[0.98]"
              style={
                on
                  ? {
                      background: "var(--color-accent-600)",
                      color: "#fff",
                      border: "1.5px solid var(--color-accent-600)",
                    }
                  : {
                      background: "var(--color-bg)",
                      color: "var(--color-neutral-700)",
                      border: "1.5px solid var(--color-neutral-300)",
                    }
              }
            >
              {l.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
