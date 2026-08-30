"use client";

import { useState } from "react";
import { translate, type Lang } from "@/lib/i18n";
import { BottomSheet } from "@/components/BottomSheet";
import { WalkInForm } from "@/components/WalkInForm";

type UserProduct = { id: string; name: string; unit: string; pricePerUnit: number };
type DailyCustomer = { id: string; name: string };

/**
 * The "+ Log a walk-in order" trigger. Tapping it slides the walk-in form up as
 * a bottom sheet (design option 4a); saving or cancelling slides it back down.
 */
export function WalkInEntry({
  dailyCustomers = [],
  userProducts = [],
  lang = "en",
}: {
  dailyCustomers?: DailyCustomer[];
  userProducts?: UserProduct[];
  lang?: Lang;
}) {
  const t = (k: string) => translate(lang, k);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-[60px] w-full items-center justify-center gap-2.5 rounded-full text-[16.5px] font-bold text-white transition active:scale-[0.98]"
        style={{ background: "var(--color-accent-600)", boxShadow: "var(--shadow-md)" }}
      >
        <span className="text-[19px] leading-none">+</span>
        {t("walk.logOrder")}
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)}>
        <WalkInForm
          bare
          onClose={() => setOpen(false)}
          lang={lang}
          dailyCustomers={dailyCustomers}
          userProducts={userProducts}
          initialOrders={[]}
        />
      </BottomSheet>
    </>
  );
}
