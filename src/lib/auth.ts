import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import { createDemoUser } from "@/lib/demo";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const username = credentials?.username;
        const password = credentials?.password;
        if (typeof username !== "string" || typeof password !== "string") {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { username: username.toLowerCase().trim() },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, name: user.name };
      },
    }),
    // "See it in action": signs the visitor into a fresh, pre-filled demo account.
    Credentials({
      id: "demo",
      name: "Demo",
      credentials: {},
      authorize: async () => {
        try {
          const user = await createDemoUser();
          return { id: user.id, name: user.name, demo: true };
        } catch (e) {
          console.error("[demo] could not create demo account", e);
          throw e;
        }
      },
    }),
  ],
});
