import type { TrustLevel } from "@/lib/business";

// Trust reads as one sage → beige → terracotta ramp, on the app palette.
const STYLES: Record<TrustLevel["label"], string> = {
  Excellent: "bg-[#E1EECC] text-[#3D472B]",
  Good: "bg-[#F0FAE1] text-[#56633F]",
  Fair: "bg-[#F3E7C7] text-[#645C50]",
  Poor: "bg-[#FDEEDD] text-[#8C491A]",
  "Very Poor": "bg-[#FFE1D0] text-[#402310]",
};

export function TrustBadge({ trust }: { trust: TrustLevel }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[trust.label]}`}>
      {"★".repeat(trust.score)}
      {"☆".repeat(5 - trust.score)} {trust.label}
    </span>
  );
}
