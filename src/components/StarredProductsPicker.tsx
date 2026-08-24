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
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-700">Star items</h2>
        <p className="text-xs text-slate-400">
          Starred items get their own card on the dashboard showing how much you sold and earned.
        </p>
      </div>

      {options.length === 0 ? (
        <p className="text-sm text-slate-500">No items yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {options.map((o) => {
            const on = starred.includes(o.name);
            return (
              <li key={o.name} className="flex items-center gap-3 px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => toggle(o.name)}
                  disabled={saving}
                  aria-pressed={on}
                  aria-label={on ? `Unstar ${o.name}` : `Star ${o.name}`}
                  className={`text-2xl leading-none transition disabled:opacity-50 ${
                    on ? "text-amber-500" : "text-slate-300 hover:text-slate-400"
                  }`}
                >
                  {on ? "★" : "☆"}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{o.name}</p>
                  <p className="text-xs text-slate-500">
                    per {o.unit}
                    {o.builtin ? "" : " · your item"}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
