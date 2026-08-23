import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { customerSchema } from "@/lib/validation";

async function assertOwnedCustomer(userId: string, customerId: string) {
  const customer = await prisma.customer.findFirst({ where: { id: customerId, userId } });
  return customer;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await assertOwnedCustomer(session.user.id, id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = customerSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const data = parsed.data;
  const customer = await prisma.customer.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.address !== undefined && { address: data.address || null }),
      ...(data.defaultPricePerUnit !== undefined && { defaultPricePerUnit: data.defaultPricePerUnit }),
      ...(data.dailyQuantity !== undefined && { dailyQuantity: data.dailyQuantity }),
      ...(data.manualTrustRating !== undefined && { manualTrustRating: data.manualTrustRating }),
    },
  });

  return NextResponse.json(customer);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await assertOwnedCustomer(session.user.id, id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.customer.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
