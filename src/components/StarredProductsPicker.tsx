"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Option = { name: string; unit: string; builtin: boolean };

export function StarredProductsPicker({
  options,
  initialStarred,
}: {
  options: Option[];
  initialStarred: string[];
}) {
  const router = useRouter();
  const [starred, setStarred] = useState<string[]>(initialStarred);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle(name: string) {
    const next = starred.includes(name) ? starred.filter((n) => n !== name) : [...starred, name];
    const previous = starred;
    setStarred(next);
    setSaving(true);
    setError(null);
    const res = await fetch("/api/settings/starred", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ starredProducts: next }),
    });
    setSaving(false);
    if (!res.ok) {
      setStarred(previous);
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-[13px] font-semibold text-[var(--color-accent-2-900)]">Star items</h2>
        <p className="mt-0.5 text-[12px] text-[var(--color-accent-2-800)]">
          Starred items get their own card on the dashboard.
        </p>
      </div>

      {options.length === 0 ? (
        <p className="text-sm text-[var(--color-accent-2-800)]">No items yet.</p>
      ) : (
        <ul>
          {options.map((o, i) => {
            const on = starred.includes(o.name);
            return (
              <li
                key={o.name}
                className="flex items-center gap-3 py-[11px] px-1"
                style={i > 0 ? { borderTop: "1.5px solid var(--color-accent-2-200)" } : undefined}
              >
                <button
                  type="button"
                  onClick={() => toggle(o.name)}
                  disabled={saving}
                  aria-pressed={on}
                  aria-label={on ? `Unstar ${o.name}` : `Star ${o.name}`}
                  className="text-[21px] leading-none transition disabled:opacity-50"
                  style={{ color: on ? "var(--color-accent)" : "var(--color-accent-2-400, #aebf92)" }}
                >
                  {on ? "★" : "☆"}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--color-accent-900)]">{o.name}</p>
                  <p className="text-[12px] text-[var(--color-accent-2-800)]">per {o.unit}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {error && <p className="text-sm text-[#8C491A]">{error}</p>}
    </div>
  );
}
