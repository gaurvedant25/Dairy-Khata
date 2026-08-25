import { cookies } from "next/headers";
import type { Lang } from "@/lib/i18n";
import { translate } from "@/lib/i18n";

/** Read the chosen language from the cookie (defaults to English). */
export async function getLang(): Promise<Lang> {
  const store = await cookies();
  return store.get("lang")?.value === "hi" ? "hi" : "en";
}

/** Convenience: get a bound translator for a server component. */
export async function getT() {
  const lang = await getLang();
  return {
    lang,
    t: (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars),
  };
}
