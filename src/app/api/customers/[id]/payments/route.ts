import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paymentSchema } from "@/lib/validation";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const customer = await prisma.customer.findFirst({ where: { id, userId: session.user.id } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = paymentSchema.safeParse({ ...body, customerId: id });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { amount, date, note } = parsed.data;
  const payment = await prisma.payment.create({
    data: {
      customerId: id,
      amount,
      date: new Date(date),
      note: note || null,
    },
  });

  return NextResponse.json(payment, { status: 201 });
}
