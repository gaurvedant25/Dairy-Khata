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
    <div className="rounded-xl border border-[#E0CB9E] bg-[#FBF3D1] p-4">
      <div className="mb-3 flex items-center justify-between">
        <Link
          href={href(iso(prev.getFullYear(), prev.getMonth(), 1))}
          aria-label="Previous month"
          className="rounded-md px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          ‹
        </Link>
        <p className="text-sm font-semibold text-[#4E220F]">
          {MONTHS[month0]} {year}
        </p>
        <Link
          href={href(iso(next.getFullYear(), next.getMonth(), 1))}
          aria-label="Next month"
          className="rounded-md px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          ›
        </Link>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="text-center text-[11px] font-medium text-slate-400">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
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
              className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition ${
                isSelected
                  ? "bg-[#9D6638] font-semibold text-white"
                  : isToday
                  ? "border border-[#9D6638] font-semibold text-[#9D6638] hover:bg-[#9D6638]/10"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {day}
              {hasActivity && (
                <span
                  className={`absolute bottom-1 h-1 w-1 rounded-full ${
                    isSelected ? "bg-[#FBF3D1]" : "bg-[#9D6638]/100"
                  }`}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
