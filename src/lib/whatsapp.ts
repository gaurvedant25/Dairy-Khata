type BillInput = {
  customerName: string;
  businessName: string;
  milkLiters: number;
  milkAmount: number;
  extraItems: { product: string; unit: string; quantity: number; amount: number }[];
  totalPaid: number;
  dues: number;
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

/** Build a short, WhatsApp-friendly bill message (asterisks render as bold). */
export function buildBillMessage(b: BillInput): string {
  const lines: string[] = [];
  lines.push(`Namaste ${b.customerName} 🙏`);
  lines.push("");
  lines.push(`*${b.businessName}* — Bill`);
  lines.push("");

  if (b.milkLiters > 0) {
    lines.push(`Milk: ${b.milkLiters.toFixed(1)} L — ₹${b.milkAmount.toFixed(2)}`);
  }
  for (const it of b.extraItems) {
    const qty = it.unit ? `${it.quantity.toFixed(it.unit === "piece" ? 0 : 1)} ${it.unit}` : "";
    lines.push(`${it.product}${qty ? ` ${qty}` : ""} — ₹${it.amount.toFixed(2)}`);
  }
  if (b.totalPaid > 0) {
    lines.push(`Paid: ₹${b.totalPaid.toFixed(2)}`);
  }

  lines.push("————————");
  lines.push(`*Total due: ₹${b.dues.toFixed(2)}*`);
  lines.push("");
  lines.push("Please clear your dues. Dhanyavaad 🙏");

  return lines.join("\n");
}

export function buildWhatsAppLink(phoneDigits: string, message: string): string {
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
}
