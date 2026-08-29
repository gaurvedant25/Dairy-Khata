"use client";

import Link from "next/link";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function iso(y: number, m0: number, d: number) {
  return `${y}-${String(m0 + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function Calendar({
  year,
  month0,
  selectedDate,
  todayDate,
  activity,
  period,
}: {
  year: number;
  month0: number;
  selectedDate: string;
  todayDate: string;
  activity: Record<number, number>;
  period: string;
}) {
  const firstWeekday = new Date(year, month0, 1).getDay();
  const daysInMonth = new Date(year, month0 + 1, 0).getDate();

  const prev = new Date(year, month0 - 1, 1);
  const next = new Date(year, month0 + 1, 1);

  function href(dateStr: string) {
    return `/dashboard?period=${period}&date=${dateStr}`;
  }

  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <section
      className="rounded-[28px] px-4 pb-5 pt-[18px]"
      style={{ background: "var(--color-neutral-100)", boxShadow: "var(--shadow-sm)" }}
    >
      <div className="flex items-center justify-between px-1 pb-3.5">
        <Link
          href={href(iso(prev.getFullYear(), prev.getMonth(), 1))}
          aria-label="Previous month"
          className="flex h-[34px] w-[34px] items-center justify-center rounded-full text-[var(--color-neutral-700)]"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <p className="font-heading text-[17px] text-[var(--color-accent-900)]">
          {MONTHS[month0]} {year}
        </p>
        <Link
          href={href(iso(next.getFullYear(), next.getMonth(), 1))}
          aria-label="Next month"
          className="flex h-[34px] w-[34px] items-center justify-center rounded-full text-[var(--color-neutral-700)]"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-0.5 pb-1.5">
        {WEEKDAYS.map((w, i) => (
          <div
            key={i}
            className="text-center text-[11px] font-bold tracking-[.08em] text-[var(--color-neutral-500)]"
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />;
          const dateStr = iso(year, month0, day);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayDate;
          const hasActivity = (activity[day] ?? 0) > 0;

          return (
            <Link
              key={dateStr}
              href={href(dateStr)}
              className="flex aspect-square flex-col items-center justify-center gap-[3px] rounded-full text-sm transition"
              style={{
                background: isSelected ? "var(--color-accent-600)" : "transparent",
                color: isSelected
                  ? "#fff"
                  : isToday
                  ? "var(--color-accent-700)"
                  : "var(--color-neutral-700)",
                fontWeight: isSelected || isToday ? 700 : 500,
              }}
            >
              <span>{day}</span>
              <span
                className="h-1 w-1 rounded-full"
                style={{
                  background: hasActivity
                    ? isSelected
                      ? "rgba(255,255,255,.75)"
                      : "var(--color-accent-2-600)"
                    : "transparent",
                }}
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
