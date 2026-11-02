import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      /** Signed in through "See it in action" (a throwaway demo account). */
      demo?: boolean;
    } & DefaultSession["user"];
  }
  interface User {
    demo?: boolean;
  }
}
