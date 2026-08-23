"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type IconName = "home" | "truck" | "users" | "walk" | "settings";

function Icon({ name, className }: { name: IconName; className?: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 24 24",
    className,
  };
  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
          <path d="M10 21v-6h4v6" />
        </svg>
      );
    case "truck":
      return (
        <svg {...common}>
          <rect x="3" y="7" width="12" height="9" rx="1.5" />
          <path d="M15 10h4l2 3v3h-6" />
          <circle cx="7" cy="18" r="1.75" />
          <circle cx="17" cy="18" r="1.75" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3.25" />
          <path d="M3 20c0-3 2.7-5 6-5s6 2 6 5" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M15.5 14.5c2.5.3 5.5 1.6 5.5 4.5" />
        </svg>
      );
    case "walk":
      return (
        <svg {...common}>
          <circle cx="13" cy="4.5" r="1.5" />
          <path d="M12 8.5c-1.5.5-2.5 2-2.5 3.5v3l-2 5" />
          <path d="M12 12l2.5 2 2 4" />
          <path d="M12 12l-2 4" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="2.5" />
          <path d="M19.5 12c0-.4 0-.8-.1-1.2l2-1.6-2-3.4-2.4.8a7 7 0 0 0-2-1.2l-.4-2.5h-4l-.4 2.5a7 7 0 0 0-2 1.2l-2.4-.8-2 3.4 2 1.6c-.1.4-.1.8-.1 1.2s0 .8.1 1.2l-2 1.6 2 3.4 2.4-.8c.6.5 1.3.9 2 1.2l.4 2.5h4l.4-2.5a7 7 0 0 0 2-1.2l2.4.8 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z" />
        </svg>
      );
  }
}

const LINKS: { href: string; label: string; shortLabel: string; icon: IconName }[] = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Home", icon: "home" },
  { href: "/deliveries", label: "Deliveries", shortLabel: "Deliver", icon: "truck" },
  { href: "/customers", label: "Daily customers", shortLabel: "Daily", icon: "users" },
  { href: "/walk-in", label: "Walk-in", shortLabel: "Walk-in", icon: "walk" },
  { href: "/settings", label: "Settings", shortLabel: "Settings", icon: "settings" },
];

export function NavLinks({ orientation }: { orientation: "horizontal" | "vertical" }) {
  const pathname = usePathname();

  return (
    <nav
      className={
        orientation === "vertical"
          ? "flex flex-col gap-1"
          : "flex justify-around pb-[env(safe-area-inset-bottom)]"
      }
    >
      {LINKS.map((link) => {
        const active = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              orientation === "vertical"
                ? `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`
                : `flex flex-1 flex-col items-center gap-0.5 px-2 py-2 text-[11px] font-medium transition ${
                    active ? "text-blue-600" : "text-slate-400"
                  }`
            }
          >
            <Icon name={link.icon} className={orientation === "horizontal" ? "h-6 w-6" : "h-5 w-5"} />
            <span>{orientation === "horizontal" ? link.shortLabel : link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
