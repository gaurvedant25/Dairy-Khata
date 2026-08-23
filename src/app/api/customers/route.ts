import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { customerSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = customerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { name, phone, address, defaultPricePerUnit, dailyQuantity, manualTrustRating } = parsed.data;

  const customer = await prisma.customer.create({
    data: {
      userId: session.user.id,
      name,
      phone: phone || null,
      address: address || null,
      defaultPricePerUnit: defaultPricePerUnit ?? null,
      dailyQuantity: dailyQuantity ?? 1,
      manualTrustRating: manualTrustRating ?? null,
    },
  });

  return NextResponse.json(customer, { status: 201 });
}
