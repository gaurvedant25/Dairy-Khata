import { cookies } from "next/headers";

export type Theme = "light" | "dark";

/** Read the chosen theme from the cookie (defaults to light). */
export async function getTheme(): Promise<Theme> {
  const store = await cookies();
  return store.get("theme")?.value === "dark" ? "dark" : "light";
}
