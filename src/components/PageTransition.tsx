"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Order matches the bottom nav so we can tell "forward" (moving right through
// the tabs) from "back" and animate the slide direction accordingly.
const ORDER = ["/dashboard", "/deliveries", "/customers", "/walk-in", "/settings"];

function navIndex(pathname: string) {
  const i = ORDER.findIndex((p) => pathname.startsWith(p));
  return i === -1 ? ORDER.length : i;
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevIndexRef = useRef(navIndex(pathname));

  const current = navIndex(pathname);
  // Compare against the PREVIOUS committed index. The ref is only updated in
  // the effect below (after paint), so double-renders in dev don't clobber it.
  const direction = current >= prevIndexRef.current ? "forward" : "back";

  useEffect(() => {
    prevIndexRef.current = current;
  }, [current]);

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
