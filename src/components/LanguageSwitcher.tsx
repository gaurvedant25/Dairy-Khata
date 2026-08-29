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
    <div>
      <label className="block text-xs font-medium text-slate-500">{label}</label>
      <select
        value={current}
        onChange={(e) => change(e.target.value)}
        className="mt-1 w-full rounded-lg border border-[#D6BE8C] bg-[#FBF3D1] px-3 py-2 text-sm text-[#402310] sm:w-48"
      >
        {LANGS.map((l) => (
          <option key={l.value} value={l.value}>
            {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}
