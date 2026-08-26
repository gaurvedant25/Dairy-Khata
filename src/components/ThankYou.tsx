"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

export function ThankYou() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const colors = ["#9D6638", "#4E220F", "#B0BA99", "#FFEED6", "#E8D7B0", "#facc15"];
    const pieces = Array.from({ length: 160 }, () => ({
      x: Math.random() * w,
      y: -20 - Math.random() * h * 0.4,
      r: 5 + Math.random() * 7,
      c: colors[Math.floor(Math.random() * colors.length)],
      vy: 2 + Math.random() * 4,
      vx: -2 + Math.random() * 4,
      rot: Math.random() * Math.PI,
      vr: -0.2 + Math.random() * 0.4,
    }));

    let raf = 0;
    const start = Date.now();
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of pieces) {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        if (p.y > h + 20) {
          p.y = -20;
          p.x = Math.random() * w;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.5);
        ctx.restore();
      }
      if (Date.now() - start < 4500) raf = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, w, h);
    };
    draw();

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" aria-hidden />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-[#E0CB9E] bg-[#FBF3D1] p-8 text-center">
        <div className="text-5xl">🎉</div>
        <h1 className="mt-3 text-2xl font-bold text-[#4E220F]">Thank you for purchasing!</h1>
        <p className="mt-2 text-sm text-slate-600">
          Your Dairy Ledger Premium subscription is now active. You&apos;re all set for the next 30 days.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block w-full rounded-lg bg-[#9D6638] px-4 py-3 text-sm font-semibold text-white hover:bg-[#4E220F]"
        >
          Go to app →
        </Link>
      </div>
    </div>
  );
}
