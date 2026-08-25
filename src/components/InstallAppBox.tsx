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
      <h2 className="mb-1 text-base font-semibold text-[#FFEED6]">{title}</h2>
      {isStandalone ? (
        <p className="text-sm text-[#B0BA99]">{installed}</p>
      ) : deferred ? (
        <>
          <p className="mb-3 text-xs text-[#E8D7B0]">{bodyAndroid}</p>
          <button
            onClick={install}
            className="inline-flex items-center gap-2 rounded-lg bg-[#FFEED6] px-4 py-2 text-sm font-semibold text-[#4E220F] hover:bg-[#FBF3D1]"
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
        <p className="text-xs text-[#E8D7B0]">{isIos ? bodyIos : bodyAndroid}</p>
      )}
    </div>
  );
}
