"use client";

import { useEffect } from "react";

// Adds `.is-visible` to [data-reveal] elements as they scroll into view, with a
// small stagger per element. Mirrors the scroll-reveal in the Claude Design
// source. Falls back to revealing everything after 1.5s (and immediately when
// IntersectionObserver is unavailable) so nothing stays hidden.
export function LandingReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    els.forEach((el) => {
      const n = parseInt((el.dataset.reveal || "").replace(/\D/g, ""), 10) || 0;
      el.style.transitionDelay = `${n * 0.08}s`;
    });

    const revealAll = () => els.forEach((el) => el.classList.add("is-visible"));

    if (!("IntersectionObserver" in window)) {
      revealAll();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    const fallback = setTimeout(revealAll, 1500);

    return () => {
      io.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  return null;
}
