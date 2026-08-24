"use client";

import { usePathname } from "next/navigation";
import { useRef } from "react";

// Order matches the bottom nav so we can tell "forward" (swipe left→right
// through the tabs) from "back" and animate the slide direction accordingly.
const ORDER = ["/dashboard", "/deliveries", "/customers", "/walk-in", "/settings"];

function navIndex(pathname: string) {
  const i = ORDER.findIndex((p) => pathname.startsWith(p));
  return i === -1 ? ORDER.length : i;
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevIndex = useRef(navIndex(pathname));

  const current = navIndex(pathname);
  const direction = current >= prevIndex.current ? "forward" : "back";
  prevIndex.current = current;

  return (
    <div className="overflow-x-hidden">
      <div
        key={pathname}
        className={direction === "forward" ? "page-enter-right" : "page-enter-left"}
      >
        {children}
      </div>
    </div>
  );
}
