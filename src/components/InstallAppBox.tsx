"use client";

import { useEffect, useState } from "react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallAppBox({
  title,
  bodyAndroid,
  bodyIos,
  installed,
  button,
}: {
  title: string;
  bodyAndroid: string;
  bodyIos: string;
  installed: string;
  button: string;
}) {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Already installed / running as an app?
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIos(/iphone|ipad|ipod/.test(ua));

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", () => setIsStandalone(true));
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  return (
    <div>
      <h2 className="mb-1 text-[15px] font-semibold text-white">{title}</h2>
      {isStandalone ? (
        <p className="text-[12.5px]" style={{ color: "#ccdbb2" }}>{installed}</p>
      ) : deferred ? (
        <>
          <p className="mb-3 text-[12.5px]" style={{ color: "var(--color-accent-200)" }}>{bodyAndroid}</p>
          <button
            onClick={install}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-full px-[18px] text-[13.5px] font-bold transition active:scale-[0.98]"
            style={{ background: "var(--color-accent-100)", color: "var(--on-accent-ink)" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
            {button}
          </button>
        </>
      ) : (
        <p className="text-[12.5px]" style={{ color: "var(--color-accent-200)" }}>{isIos ? bodyIos : bodyAndroid}</p>
      )}
    </div>
  );
}
