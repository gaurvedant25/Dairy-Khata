export type MilkDay = {
  dateLabel: string; // e.g. "1 Aug"
  litres: number;
  amount: number;
};

export type BillExtra = {
  product: string;
  unit: string;
  quantity: number;
  amount: number;
};

type BillInput = {
  businessName: string;
  monthLabel: string; // e.g. "August 2026"
  milkDays: MilkDay[];
  totalMilkLitres: number;
  milkRate: number | null; // latest ₹/L charged this month, or null if no milk
  extras: BillExtra[]; // non-milk items, summed per product for the month
  previousDue: number;
  thisMonthDue: number;
  totalDue: number;
};

/**
 * Turn an Indian-style phone number into the digits wa.me expects.
 * Strips spaces/punctuation and adds the 91 country code for bare 10-digit
 * numbers. Returns null if there aren't enough digits to be usable.
 */
export function toWhatsAppNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 10) digits = "91" + digits;
  else if (digits.length === 11 && digits.startsWith("0")) digits = "91" + digits.slice(1);
  if (digits.length < 11) return null;
  return digits;
}

/** ₹ amount without trailing ".00" (e.g. 120 → "₹120", 89.5 → "₹89.50"). */
function money(n: number): string {
  return "₹" + (Number.isInteger(n) ? String(n) : n.toFixed(2));
}

/** Quantity label, e.g. "2 kg", "3 piece". */
function qtyLabel(quantity: number, unit: string): string {
  const q = quantity.toFixed(unit === "piece" ? 0 : 1);
  return unit ? `${q} ${unit}` : q;
}

/**
 * Build the milk bill: every delivery for the month (date — litres — amount),
 * the month's total litres and rate, any non-milk extras, then the dues split
 * (previous / this month / total). Asterisks render as bold in WhatsApp.
 */
export function buildBillMessage(b: BillInput): string {
  const lines: string[] = [];
  lines.push("Namaste 🙏");
  lines.push("");
  lines.push(`*${b.businessName}*`);
  lines.push(`Milk bill — ${b.monthLabel}`);
  lines.push("");

  if (b.milkDays.length === 0) {
    lines.push("No milk deliveries this month.");
  } else {
    for (const d of b.milkDays) {
      lines.push(`${d.dateLabel} — ${d.litres.toFixed(1)} L — ${money(d.amount)}`);
    }
    lines.push("————————");
    lines.push(`Total milk: ${b.totalMilkLitres.toFixed(1)} L`);
    if (b.milkRate != null) lines.push(`Rate: ${money(b.milkRate)} / L`);
  }

  if (b.extras.length > 0) {
    lines.push("");
    lines.push("Other items:");
    for (const e of b.extras) {
      lines.push(`${e.product} — ${qtyLabel(e.quantity, e.unit)} — ${money(e.amount)}`);
    }
  }

  lines.push("");
  lines.push(`Previous due: ${money(b.previousDue)}`);
  lines.push(`This month: ${money(b.thisMonthDue)}`);
  lines.push(`*Total due: ${money(b.totalDue)}*`);
  lines.push("");
  lines.push("Please clear your dues. Dhanyavaad 🙏");

  return lines.join("\n");
}

export function buildWhatsAppLink(phoneDigits: string, message: string): string {
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
}
