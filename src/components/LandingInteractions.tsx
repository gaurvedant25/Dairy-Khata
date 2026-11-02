"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Wires up the landing page's interactive bits. The page itself is static
// HTML (see app/page.tsx), so everything here hangs off data-* hooks:
//   data-top            sticky header, firms up after scrolling
//   data-spot           card with a cursor-following spotlight
//   .tick               tap-to-tick delivery rows (+ data-round-count)
//   data-send/data-bill the "Send on WhatsApp" toy
//   data-chart          walk-in bars, read out into data-readout
//   data-lang(-toggle)  English/Hindi switch for the page (and the app, via
//                       the same `lang` cookie LanguageSwitcher writes)
//   data-i18n(-html)    text swapped by the language switch

type Lang = "en" | "hi";

const HI: Record<string, string> = {
  "nav.features": "खूबियाँ",
  "nav.how": "कैसे शुरू करें",
  "nav.free": "बिल्कुल मुफ़्त",
  signin: "साइन इन",
  startFree: "मुफ़्त शुरू करें",
  badge: "अब कागज़ी रजिस्टर नहीं",
  h1: 'छोड़िए <span style="color:#F6A06B;">रजिस्टर।</span><br>सब लाइव चलाइए।',
  lede: "हर डिलीवरी, हर बकाया रुपया, हर WhatsApp बिल — उसी पल दर्ज। हिंदी या अंग्रेज़ी में।",
  seeIt: "देखिए कैसे चलता है",
  freeNote: "हर डेयरी के लिए मुफ़्त · डेमो के लिए साइन-अप नहीं चाहिए",
  openDemo: "लाइव डेमो खोलें →",
  featH: 'चार काम।<br><span style="color:#F6A06B;">कागज़ बिल्कुल नहीं।</span>',
  featP: "डेयरी का हर काम, उसी क्रम में जैसे आप करते हैं: डिलीवरी, बकाया, काउंटर, बिल। छूकर देखिए।",
  f0h: "रोज़ की डिलीवरी",
  f0p: "पूरे दिन की डिलीवरी मिनटों में दर्ज करें। मात्रा डालिए, कुल हिसाब अपने-आप।",
  tryDemo: "डेमो में आज़माइए",
  delivered: "पहुँचा · टिक करने के लिए दबाएँ",
  f1h: "बकाया और WhatsApp बिल",
  f1p: "डिलीवरी दर्ज करते ही बकाया अपडेट। वसूली के समय WhatsApp पर पूरा बिल भेजें।",
  f2h: "काउंटर बिक्री और रिपोर्ट",
  f2p: "काउंटर की बिक्री आपकी रोज़ की डिलीवरी के साथ। रोज़ और महीने का कुल, हमेशा साफ़।",
  f3h: "अंग्रेज़ी या हिंदी",
  f3p: "एक टैप में पूरा ऐप भाषा बदल लेता है — आपके लिए या काउंटर पर बैठे किसी और के लिए। आज़माइए: यह पेज भी बदल जाता है।",
  howH: "तीन कदम में शुरू",
  s0h: "अपनी दुकान सेट करें",
  s0p: "अपने उत्पाद और रेट जोड़ें।",
  s1h: "ग्राहक जोड़ें",
  s1p: "नाम, पता, रोज़ का ऑर्डर।",
  s2h: "डिलीवरी दर्ज करें",
  s2p: "बकाया अपने-आप अपडेट होता है।",
  freeH: "मुफ़्त।<br>हर डेयरी के लिए।",
  freeP: "कोई प्लान नहीं, कोई ट्रायल नहीं, कोई कार्ड नहीं। Dairy Ledger सबके लिए पूरी तरह मुफ़्त है।",
  included: "सब कुछ शामिल",
  inc0: "रोज़ की डिलीवरी और चालू बकाया",
  inc1: "WhatsApp बिल और याद दिलाना",
  inc2: "काउंटर बिक्री और मासिक रिपोर्ट",
  inc3: "अंग्रेज़ी और हिंदी",
  ctaH: "रजिस्टर रख दीजिए।",
  ctaP: "पहले नमूना डेटा के साथ देखिए, या अभी अपनी डेयरी सेट कीजिए।",
};

const DAYS_HI: Record<string, string> = { Mon: "सोम", Tue: "मंगल", Wed: "बुध", Thu: "गुरु", Fri: "शुक्र", Sat: "शनि" };

export function LandingInteractions() {
  const router = useRouter();

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".dl");
    if (!root) return;
    let lang: Lang = document.cookie.includes("lang=hi") ? "hi" : "en";
    const cleanups: (() => void)[] = [];
    const on = <K extends keyof HTMLElementEventMap>(
      el: EventTarget,
      type: K,
      fn: (e: HTMLElementEventMap[K]) => void,
    ) => {
      el.addEventListener(type, fn as EventListener);
      cleanups.push(() => el.removeEventListener(type, fn as EventListener));
    };

    // Instant navigation: preload the pages the landing links to and move
    // there client-side instead of reloading the whole site. /demo and
    // /demo/exit are route handlers (they sign people in and out), so those
    // stay normal page loads.
    const appLink = (a: HTMLAnchorElement | null) => {
      const href = a?.getAttribute("href");
      return href && href.startsWith("/") && !href.startsWith("/demo") ? href : null;
    };
    new Set(Array.from(root.querySelectorAll<HTMLAnchorElement>("a")).map(appLink)).forEach(
      (href) => href && router.prefetch(href),
    );
    on(root, "click", (e) => {
      const a = (e.target as Element).closest("a");
      const href = appLink(a);
      if (!href || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      router.push(href);
    });

    // Sticky header
    const top = root.querySelector<HTMLElement>("[data-top]");
    const onScroll = () => top?.classList.toggle("scrolled", window.scrollY > 12);
    onScroll();
    on(window, "scroll", onScroll);

    // Card spotlights
    root.querySelectorAll<HTMLElement>("[data-spot]").forEach((card) =>
      on(card, "pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      }),
    );

    // Tick rows
    const count = root.querySelector("[data-round-count]");
    const sageTicks = () => root.querySelectorAll('.tick.sage[aria-pressed="true"]').length;
    root.querySelectorAll<HTMLButtonElement>(".tick").forEach((b) =>
      on(b, "click", () => {
        b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true"));
        if (count) count.textContent = String(sageTicks());
      }),
    );

    // Send-a-bill toy
    const send = root.querySelector<HTMLButtonElement>("[data-send]");
    const sendLabel = root.querySelector("[data-send-label]");
    const bill = root.querySelector<HTMLElement>("[data-bill]");
    const paintSend = () => {
      const sent = send?.classList.contains("sent");
      if (sendLabel)
        sendLabel.textContent = sent
          ? lang === "hi" ? "भेज दिया ✓ (फिर दबाएँ)" : "Sent ✓ (tap to reset)"
          : lang === "hi" ? "WhatsApp पर भेजें" : "Send on WhatsApp";
    };
    if (send)
      on(send, "click", () => {
        send.classList.toggle("sent");
        if (send.classList.contains("sent") && bill) {
          bill.classList.remove("flying");
          void bill.offsetWidth; // restart the animation
          bill.classList.add("flying");
        }
        paintSend();
      });

    // Chart readout
    const readout = root.querySelector("[data-readout]");
    const bars = Array.from(root.querySelectorAll<HTMLButtonElement>(".bar"));
    let picked = bars[bars.length - 1];
    const show = (bar: HTMLButtonElement) => {
      bars.forEach((x) => x.classList.toggle("on", x === bar));
      const day = bar.dataset.day ?? "";
      if (readout) readout.textContent = `${lang === "hi" ? DAYS_HI[day] ?? day : day} · ₹${bar.dataset.val}`;
    };
    bars.forEach((bar) => {
      on(bar, "click", () => {
        picked = bar;
        show(bar);
      });
      on(bar, "mouseenter", () => show(bar));
      on(bar, "focus", () => show(bar));
      on(bar, "mouseleave", () => show(picked));
    });

    // Language switch
    const knob = root.querySelector<HTMLElement>("[data-knob]");
    const langBtns = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-lang]"));
    const moveKnob = () => {
      const active = langBtns.find((b) => b.dataset.lang === lang);
      if (knob && active) {
        knob.style.left = `${active.offsetLeft}px`;
        knob.style.width = `${active.offsetWidth}px`;
      }
    };
    const applyLang = (next: Lang, persist: boolean) => {
      lang = next;
      document.documentElement.lang = next;
      root.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
        el.dataset.en ??= el.textContent ?? "";
        const key = el.dataset.i18n!;
        el.textContent = next === "hi" && HI[key] ? HI[key] : el.dataset.en;
      });
      root.querySelectorAll<HTMLElement>("[data-i18n-html]").forEach((el) => {
        el.dataset.en ??= el.innerHTML;
        const key = el.dataset.i18nHtml!;
        el.innerHTML = next === "hi" && HI[key] ? HI[key] : el.dataset.en;
      });
      langBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === next)));
      moveKnob();
      paintSend();
      show(picked);
      // Same cookie the in-app LanguageSwitcher uses, so the app opens in this language.
      if (persist) document.cookie = `lang=${next}; path=/; max-age=31536000`;
    };
    langBtns.forEach((b) => on(b, "click", () => applyLang(b.dataset.lang as Lang, true)));
    root
      .querySelectorAll("[data-lang-toggle]")
      .forEach((b) => on(b, "click", () => applyLang(lang === "en" ? "hi" : "en", true)));
    on(window, "resize", moveKnob);
    applyLang(lang, false);

    return () => cleanups.forEach((c) => c());
  }, [router]);

  return null;
}
