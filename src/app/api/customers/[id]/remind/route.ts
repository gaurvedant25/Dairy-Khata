import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const customer = await prisma.customer.findFirst({ where: { id, userId: session.user.id } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.customer.update({ where: { id }, data: { lastReminderSentAt: new Date() } });
  return NextResponse.json({ ok: true });
}
