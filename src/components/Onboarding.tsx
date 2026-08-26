"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { translate, type Lang } from "@/lib/i18n";

type Props = {
  hasCustomers: boolean;
  hasDeliveries: boolean;
  hasSample: boolean;
  lang?: Lang;
};

function Step({
  n,
  title,
  sub,
  href,
  done,
  doneLabel,
}: {
  n: number;
  title: string;
  sub: string;
  href: string;
  done: boolean;
  doneLabel: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border border-[#E0CB9E] bg-white/50 p-3 transition hover:bg-white"
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          done ? "bg-emerald-600 text-white" : "bg-[#9D6638] text-white"
        }`}
      >
        {done ? "✓" : n}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[#4E220F]">{title}</span>
        <span className="block text-xs text-slate-500">{sub}</span>
      </span>
      {done ? (
        <span className="shrink-0 text-xs font-medium text-emerald-700">{doneLabel}</span>
      ) : (
        <span className="shrink-0 text-[#9D6638]">→</span>
      )}
    </Link>
  );
}

export function Onboarding({ hasCustomers, hasDeliveries, hasSample, lang = "en" }: Props) {
  const router = useRouter();
  const t = (k: string) => translate(lang, k);
  const [busy, setBusy] = useState(false);

  async function loadSample() {
    setBusy(true);
    await fetch("/api/onboarding/sample", { method: "POST" }).catch(() => {});
    setBusy(false);
    router.refresh();
  }

  async function removeSample() {
    setBusy(true);
    await fetch("/api/onboarding/sample", { method: "DELETE" }).catch(() => {});
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-[#E0CB9E] bg-[#FBF3D1] p-5">
      <h2 className="text-lg font-bold text-[#4E220F]">{t("onb.welcome")}</h2>
      <p className="mt-1 text-sm text-slate-600">{t("onb.subtitle")}</p>

      <div className="mt-4 space-y-2">
        <Step
          n={1}
          title={t("onb.step1")}
          sub={t("onb.step1sub")}
          href="/settings"
          done={false}
          doneLabel={t("onb.done")}
        />
        <Step
          n={2}
          title={t("onb.step2")}
          sub={t("onb.step2sub")}
          href="/customers"
          done={hasCustomers}
          doneLabel={t("onb.done")}
        />
        <Step
          n={3}
          title={t("onb.step3")}
          sub={t("onb.step3sub")}
          href="/deliveries"
          done={hasDeliveries}
          doneLabel={t("onb.done")}
        />
      </div>

      <div className="mt-4 border-t border-[#E0CB9E] pt-4">
        {hasSample ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-500">{t("onb.sampleLoaded")}</p>
            <button
              onClick={removeSample}
              disabled={busy}
              className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              {busy ? t("onb.removing") : t("onb.removeSample")}
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-500">{t("onb.orExplore")}</p>
            <button
              onClick={loadSample}
              disabled={busy}
              className="rounded-lg bg-[#9D6638] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#4E220F] disabled:opacity-60"
            >
              {busy ? t("onb.loading") : t("onb.loadSample")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
