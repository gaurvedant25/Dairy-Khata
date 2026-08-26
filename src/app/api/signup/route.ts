import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { name, username, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: "That username is already taken" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const user = await prisma.user.create({
    data: {
      name,
      username,
      passwordHash,
      trialEndsAt,
      setting: { create: {} },
      // Seed the one default item; the owner edits/removes it in Settings.
      customProducts: { create: { name: "Milk", unit: "L", pricePerUnit: 60 } },
    },
  });

  return NextResponse.json({ id: user.id, username: user.username });
}
