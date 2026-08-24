"use client";

import { useState } from "react";

export function CustomerHeader({
  name,
  address,
  children,
}: {
  name: string;
  address: string | null;
  children: React.ReactNode; // the edit form
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-2xl font-bold text-[#4E220F]">{name}</h1>
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              aria-expanded={editing}
              aria-label="Edit customer details"
              className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </button>
          </div>
          {address ? <p className="truncate text-sm text-slate-500">{address}</p> : null}
        </div>
      </div>

      <div
        className={`grid transition-all duration-300 ease-out ${
          editing ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="rounded-xl border border-[#E0CB9E] bg-[#FBF3D1] p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Customer details</h2>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
