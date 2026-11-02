import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LandingReveal } from "@/components/LandingReveal";
import { LandingInteractions } from "@/components/LandingInteractions";

// Marketing landing page (Claude Design "Dairy Ledger landing redesign").
// Espresso ground, terracotta + sage, Caprasimo display over Figtree.
// Static markup; LandingInteractions wires up the toys (language switch,
// tickable round, chart, bill button, card spotlights).
// Logged-in visitors skip straight to the app.
export default async function Home() {
  const session = await auth();
  if (session) redirect("/dashboard");

  const check = (color: string) =>
    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5L20 7"/></svg>`;
  const arrow = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>`;
  const play = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>`;

  // A tickable delivery row: tap to mark delivered.
  const row = (name: string, qty: string, theme: "phone" | "sage") =>
    `<button type="button" class="tick ${theme}" aria-pressed="false"><span class="box">${check("currentColor")}</span><span class="nm">${name}</span><b>${qty}</b></button>`;

  // Walk-in chart bars: tap or hover to read the day's total.
  const bars = [
    ["Mon", 1380],
    ["Tue", 2240],
    ["Wed", 1720],
    ["Thu", 2910],
    ["Fri", 2400],
    ["Sat", 3450],
  ]
    .map(
      ([d, v], i, all) =>
        `<button type="button" class="bar${i === all.length - 1 ? " on" : ""}" style="height:${Math.round(((v as number) / 3450) * 100)}%" data-day="${d}" data-val="${(v as number).toLocaleString("en-IN")}" aria-label="${d}: ₹${(v as number).toLocaleString("en-IN")}"></button>`,
    )
    .join("");

  const css = `
  html{scroll-behavior:smooth}
  .dl{font-family:var(--font-body),system-ui,sans-serif;color:#FDF0DA;background:#2A2722;min-height:100vh;overflow-x:hidden}
  .dl a{text-decoration:none}
  .dl button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
  .dl :focus-visible{outline:2px solid #F6A06B;outline-offset:3px;border-radius:12px}
  .dl .hd{font-family:var(--font-heading),Georgia,serif;font-weight:400}
  .dl .wrap{max-width:1200px;margin:0 auto;padding:0 32px}
  .dl .muted{color:#B9AF9F}

  /* Sticky header that firms up once you scroll */
  .dl .top{position:sticky;top:0;z-index:50;transition:background .3s,box-shadow .3s,backdrop-filter .3s}
  .dl .top.scrolled{background:rgba(42,39,34,.82);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 1px 0 rgba(253,240,218,.08)}
  .dl .top .wrap{transition:padding .3s}
  .dl .top.scrolled .wrap{padding-top:14px !important;padding-bottom:14px !important}
  .dl .logo .dot{transition:transform .4s}
  .dl .logo:hover .dot{transform:scale(1.4)}
  .dl .nav-links{display:flex;gap:32px}
  .dl .nav-links a,.dl .ul{position:relative;color:#B9AF9F;transition:color .2s}
  .dl .nav-links a::after,.dl .ul::after{content:"";position:absolute;left:0;right:0;bottom:-4px;height:2px;border-radius:2px;background:#F6A06B;transform:scaleX(0);transform-origin:left;transition:transform .25s}
  .dl .nav-links a:hover,.dl .ul:hover{color:#FDF0DA}
  .dl .nav-links a:hover::after,.dl .ul:hover::after{transform:scaleX(1)}
  .dl .signin{color:#FDF0DA;transition:color .2s}.dl .signin:hover{color:#F6A06B}
  .dl .pill{background:#FDF0DA;color:#2A2722;padding:11px 20px;border-radius:999px;transition:transform .2s,background .2s}
  .dl .pill:hover{background:#F6A06B;transform:translateY(-1px)}

  .dl .hero-grid{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:56px;align-items:center}
  .dl .badge{transition:transform .3s}.dl .badge:hover{transform:rotate(-3deg) scale(1.04)}
  .dl .badge .pulse{animation:dl-pulse 2s ease-in-out infinite}
  @keyframes dl-pulse{0%,100%{box-shadow:0 0 0 0 rgba(183,201,154,.6)}50%{box-shadow:0 0 0 6px rgba(183,201,154,0)}}
  .dl .ctas{display:flex;flex-wrap:wrap;align-items:center;gap:14px}
  .dl .btn-demo{display:inline-flex;align-items:center;gap:12px;background:#F6A06B;color:#2A2722;padding:12px 30px 12px 12px;border-radius:999px;font-size:18px;font-weight:800;box-shadow:0 14px 30px rgba(246,160,107,.25);transition:transform .2s,box-shadow .2s,background .2s}
  .dl .btn-demo:hover{transform:translateY(-2px);background:#FFB07F;box-shadow:0 18px 40px rgba(246,160,107,.4)}
  .dl .btn-demo .ic{width:38px;height:38px;border-radius:50%;background:#2A2722;color:#F6A06B;display:inline-flex;align-items:center;justify-content:center;padding-left:2px;transition:transform .3s}
  .dl .btn-demo:hover .ic{transform:scale(1.12) rotate(-8deg)}
  .dl .btn-free{display:inline-flex;align-items:center;gap:10px;color:#FDF0DA;border:1.5px solid rgba(253,240,218,.3);padding:17px 28px;border-radius:999px;font-size:17px;font-weight:700;transition:background .2s,border-color .2s}
  .dl .btn-free svg{transition:transform .2s}
  .dl .btn-free:hover{background:rgba(253,240,218,.07);border-color:rgba(253,240,218,.6)}
  .dl .btn-free:hover svg{transform:translateX(4px)}
  .dl .btn-demo:active,.dl .btn-free:active,.dl .pill:active,.dl .card-link:active{transform:scale(.97)}

  /* Phone mockup: whole thing opens the demo */
  .dl .phone-link{position:relative;display:block;width:300px;max-width:86%;color:inherit;transition:transform .5s cubic-bezier(.2,.8,.2,1)}
  .dl .phone-link:hover{transform:translateY(-8px) rotate(-1.5deg)}
  .dl .phone-hint{position:absolute;left:50%;bottom:-18px;transform:translate(-50%,6px);opacity:0;background:#FDF0DA;color:#2A2722;font-size:13px;font-weight:800;padding:8px 14px;border-radius:999px;white-space:nowrap;transition:opacity .25s,transform .25s;pointer-events:none}
  .dl .phone-link:hover .phone-hint,.dl .phone-link:focus-visible .phone-hint{opacity:1;transform:translate(-50%,0)}
  .dl .ring{animation:dl-spin 60s linear infinite}
  @keyframes dl-spin{to{transform:translate(-50%,-50%) rotate(360deg)}}
  .dl .float{transition:transform .35s cubic-bezier(.2,.8,.2,1)}
  .dl .float.wa:hover{transform:rotate(-1deg) scale(1.06)}
  .dl .float.lang:hover{transform:rotate(0) scale(1.08)}

  /* Tickable delivery rows */
  .dl .tick{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:10px 0;font-size:13px;font-weight:600;transition:opacity .2s}
  .dl .tick .nm{flex:1;transition:opacity .2s}
  .dl .tick .box{width:18px;height:18px;border-radius:6px;border:1.5px solid currentColor;opacity:.45;display:inline-flex;align-items:center;justify-content:center;transition:all .2s}
  .dl .tick .box svg{width:12px;height:12px;opacity:0;transform:scale(.5);transition:all .2s}
  .dl .tick:hover .box{opacity:1}
  .dl .tick[aria-pressed="true"] .box{opacity:1;background:#728157;border-color:#728157;color:#fff}
  .dl .tick[aria-pressed="true"] .box svg{opacity:1;transform:none}
  .dl .tick[aria-pressed="true"] .nm{opacity:.55;text-decoration:line-through}
  .dl .tick.phone{border-bottom:1px solid #EADBC2}.dl .tick.phone:last-child{border-bottom:0}
  .dl .tick.sage{font-size:14px;color:#E1EECC;padding:12px 0;border-bottom:1px solid rgba(225,238,204,.12)}.dl .tick.sage:last-child{border-bottom:0}
  .dl .tick.sage[aria-pressed="true"] .box{background:#B7C99A;border-color:#B7C99A;color:#2F3822}

  /* Feature cards with a cursor spotlight */
  .dl .bento{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}
  .dl .span2{grid-column:span 2}
  .dl .card{position:relative;overflow:hidden;transition:transform .3s cubic-bezier(.2,.8,.2,1),box-shadow .3s,border-color .3s}
  .dl .card::before{content:"";position:absolute;inset:0;background:radial-gradient(420px circle at var(--mx,50%) var(--my,50%),rgba(253,240,218,.09),transparent 45%);opacity:0;transition:opacity .3s;pointer-events:none}
  .dl .card:hover{transform:translateY(-6px);box-shadow:0 24px 50px rgba(0,0,0,.3)}
  .dl .card:hover::before{opacity:1}
  .dl .card > *{position:relative}
  .dl .card-link{display:inline-flex;align-items:center;gap:6px;margin-top:22px;font-size:14px;font-weight:800;transition:gap .2s}
  .dl .card-link:hover{gap:10px}

  .dl .bill{background:#FFF8EE;color:#2E2B25;border-radius:18px 18px 18px 4px;padding:14px 16px;font-size:13px;line-height:1.5;max-width:240px;transition:transform .3s}
  .dl .send{display:inline-flex;align-items:center;gap:8px;margin-top:12px;background:#25D366;color:#0B3B1E !important;font-size:13px;font-weight:800;padding:9px 14px;border-radius:999px;transition:transform .2s,background .2s}
  .dl .send:hover{transform:translateY(-1px);background:#3BE07A}
  .dl .send.sent{background:#FFE1D0}
  .dl .bill.flying{animation:dl-fly .6s ease}
  @keyframes dl-fly{40%{transform:translate(10px,-8px) rotate(2deg)}100%{transform:none}}

  .dl .chart{display:flex;align-items:flex-end;gap:8px;height:84px}
  .dl .bar{flex:1;background:#B2622D;border-radius:6px;transition:background .2s,transform .2s;transform-origin:bottom}
  .dl .bar:hover{background:#D67F48;transform:scaleY(1.04)}
  .dl .bar.on{background:#F6A06B}
  .dl .readout{margin-top:10px;font-size:13px;font-weight:700;color:#FFC6A5;min-height:18px}

  .dl .seg{display:inline-flex;background:#2A2722;border:1px solid rgba(253,240,218,.12);border-radius:999px;padding:6px;position:relative}
  .dl .seg button{position:relative;z-index:1;padding:12px 24px;border-radius:999px;font-weight:700;color:#B9AF9F;transition:color .3s}
  .dl .seg button[aria-pressed="true"]{color:#2A2722}
  .dl .seg button:not([aria-pressed="true"]):hover{color:#FDF0DA}
  .dl .seg .knob{position:absolute;top:6px;bottom:6px;border-radius:999px;background:#FDF0DA;transition:left .35s cubic-bezier(.2,.8,.2,1),width .35s cubic-bezier(.2,.8,.2,1)}

  /* Steps: each one is a link */
  .dl .steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}
  .dl .step{display:block;color:inherit;border-top:1px dashed rgba(246,160,107,.4);padding:28px 20px 24px;border-radius:0 0 24px 24px;transition:background .3s,border-color .3s}
  .dl .step:hover{background:rgba(253,240,218,.04);border-top-color:#F6A06B}
  .dl .step .num{display:inline-block;font-size:44px;color:#F6A06B;transition:transform .3s}
  .dl .step:hover .num{transform:translateY(-4px) rotate(-6deg)}
  .dl .step .go{display:inline-flex;align-items:center;gap:6px;margin-top:14px;font-size:14px;font-weight:800;color:#F6A06B;opacity:0;transform:translateX(-6px);transition:all .25s}
  .dl .step:hover .go,.dl .step:focus-visible .go{opacity:1;transform:none}

  .dl .free-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:48px;align-items:center}
  .dl .free-card{transition:transform .3s,box-shadow .3s}
  .dl .free-card:hover{transform:rotate(-1deg) translateY(-4px);box-shadow:0 30px 60px rgba(0,0,0,.35)}
  .dl .free-card .li{display:flex;gap:10px;align-items:center;transition:transform .2s}
  .dl .free-card .li:hover{transform:translateX(6px)}
  .dl .dark-btn{display:block;text-align:center;background:#2E2B25;color:#FDF0DA;padding:17px;border-radius:999px;font-size:17px;font-weight:800;transition:background .2s,transform .2s}
  .dl .dark-btn:hover{background:#643312;transform:translateY(-2px)}

  @keyframes dl-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
  .dl .marquee{animation:dl-marquee 32s linear infinite}
  .dl .band:hover .marquee{animation-play-state:paused}
  .dl .band a{color:#402310;transition:color .2s}
  .dl .band a:hover{color:#FDF0DA}

  .dl .cta-box .ring2{transition:transform 1.2s cubic-bezier(.2,.8,.2,1)}
  .dl .cta-box:hover .ring2{transform:rotate(90deg) scale(1.1)}
  .dl .cta-dark{display:inline-flex;align-items:center;gap:10px;background:#402310;color:#FDF0DA;padding:17px 30px;border-radius:999px;font-size:17px;font-weight:800;transition:transform .2s,background .2s}
  .dl .cta-dark:hover{transform:translateY(-2px);background:#2A1608}
  .dl .cta-line{border:1.5px solid rgba(64,35,16,.5);color:#402310;padding:15.5px 28px;border-radius:999px;font-size:17px;font-weight:800;transition:background .2s,border-color .2s}
  .dl .cta-line:hover{background:rgba(64,35,16,.08);border-color:#402310}
  .dl .to-top{color:#B9AF9F;display:inline-flex;align-items:center;gap:6px;transition:color .2s}
  .dl .to-top:hover{color:#F6A06B}

  [data-reveal]{opacity:0;transform:translateY(24px);transition:opacity .6s ease,transform .6s ease}
  [data-reveal].is-visible{opacity:1;transform:none}

  @media (max-width:960px){
    .dl .hero-grid,.dl .free-grid{grid-template-columns:minmax(0,1fr)}
    .dl .bento{grid-template-columns:minmax(0,1fr)}
    .dl .span2{grid-column:auto}
    .dl .steps{grid-template-columns:minmax(0,1fr)}
    .dl .nav-links{display:none}
    .dl .h1{font-size:58px !important}
    .dl .ctas{flex-direction:column;align-items:stretch;max-width:340px}
    .dl .ctas a{justify-content:center}
    .dl .step .go{opacity:1;transform:none}
  }
  @media (max-width:520px){
    .dl .wrap{padding:0 18px}
    .dl .h1{font-size:46px !important}
    .dl .h2{font-size:36px !important}
    .dl .phone-extra{display:none}
  }
  @media (prefers-reduced-motion:reduce){
    html{scroll-behavior:auto}
    .dl .marquee,.dl .ring,.dl .badge .pulse{animation:none}
    .dl *{transition-duration:.01ms !important}
    [data-reveal]{opacity:1 !important;transform:none !important}
  }`;

  const html = `
  <div class="dl" id="top">

    <header class="top" data-top>
      <div class="wrap" style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding-top:24px;padding-bottom:24px;">
        <a href="#top" class="logo" style="display:flex;align-items:center;gap:10px;color:#FDF0DA;">
          <span class="dot" style="width:12px;height:12px;border-radius:50%;background:#F6A06B;box-shadow:0 0 0 5px rgba(246,160,107,.18);"></span>
          <span class="hd" style="font-size:22px;">Dairy Ledger</span>
        </a>
        <nav class="nav-links" style="font-size:15px;font-weight:600;">
          <a href="#features" data-i18n="nav.features">Features</a>
          <a href="#how" data-i18n="nav.how">How it works</a>
          <a href="#free" data-i18n="nav.free">It's free</a>
        </nav>
        <div style="display:flex;align-items:center;gap:20px;font-size:15px;font-weight:700;">
          <a href="/login" class="signin" data-i18n="signin">Sign in</a>
          <a href="/signup" class="pill" data-i18n="startFree">Start free</a>
        </div>
      </div>
    </header>

    <section class="wrap" style="padding-top:40px;padding-bottom:96px;">
      <div class="hero-grid">
        <div>
          <a href="#features" class="badge" style="display:inline-flex;align-items:center;gap:8px;background:rgba(114,129,87,.22);color:#E1EECC;border:1px solid rgba(225,238,204,.18);font-size:13px;font-weight:700;letter-spacing:.06em;padding:8px 14px;border-radius:999px;">
            <span class="pulse" style="width:6px;height:6px;border-radius:50%;background:#B7C99A;"></span><span data-i18n="badge">NO MORE PAPER REGISTER</span>
          </a>
          <h1 class="hd h1" style="margin:28px 0 0;font-size:84px;line-height:.98;letter-spacing:-.01em;" data-i18n-html="h1">Ditch the <span style="color:#F6A06B;">notebook.</span><br>Run it live.</h1>
          <p class="muted" style="max-width:500px;margin:28px 0 0;font-size:19px;line-height:1.6;" data-i18n="lede">Every delivery, every rupee owed, every WhatsApp bill — tracked the second it happens. In English or Hindi.</p>
          <div class="ctas" style="margin-top:36px;">
            <a href="/demo" class="btn-demo"><span class="ic">${play}</span><span data-i18n="seeIt">See it in action</span></a>
            <a href="/signup" class="btn-free"><span data-i18n="startFree">Start free</span> ${arrow}</a>
          </div>
          <p style="margin:20px 0 0;font-size:14px;color:#9C9383;" data-i18n="freeNote">Free for every dairy · the demo needs no signup</p>
        </div>

        <div style="position:relative;display:flex;justify-content:center;padding:20px 0 36px;">
          <div class="ring" style="position:absolute;width:420px;height:420px;max-width:100%;border-radius:50%;border:1px dashed rgba(246,160,107,.28);top:50%;left:50%;transform:translate(-50%,-50%);"></div>
          <a href="/demo" class="phone-link" aria-label="Open the live demo">
            <div style="background:#1C1A17;border-radius:44px;padding:12px;box-shadow:0 40px 80px rgba(0,0,0,.45),0 0 0 1px rgba(253,240,218,.08);">
              <div style="background:#F6EBD9;border-radius:34px;overflow:hidden;color:#2E2B25;padding:22px 18px 18px;">
                <div style="display:flex;align-items:center;gap:8px;"><span style="width:9px;height:9px;border-radius:50%;background:#D67F48;"></span><span class="hd" style="font-size:15px;">Dairy Ledger</span></div>
                <p style="margin:18px 0 2px;font-size:11px;color:#6B6255;">Namaste, Mahesh</p>
                <p class="hd" style="margin:0;font-size:22px;line-height:1.1;">Shree Krishna Dairy</p>
                <div style="margin-top:14px;background:#B2622D;color:#FFF1E6;border-radius:20px;padding:16px;">
                  <p style="margin:0;font-size:10px;font-weight:800;letter-spacing:.08em;">TODAY'S SALES</p>
                  <p class="hd" style="margin:6px 0 0;font-size:30px;">₹1,843</p>
                </div>
                <div style="margin-top:10px;background:#DCE6C8;color:#2F3A20;border-radius:20px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;">
                  <div><p style="margin:0;font-size:10px;font-weight:800;letter-spacing:.08em;">TO COLLECT</p><p class="hd" style="margin:4px 0 0;font-size:22px;">₹59,504</p></div>
                  <span style="font-size:11px;font-weight:700;background:#F6EBD9;padding:6px 10px;border-radius:999px;">10 customers</span>
                </div>
                <div class="phone-extra">
                  <p style="margin:16px 0 6px;font-size:10px;font-weight:800;letter-spacing:.08em;color:#6B6255;">TODAY'S ROUND</p>
                  <div style="background:#FFF8EE;border-radius:16px;padding:4px 14px;">
                    <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #EADBC2;font-size:13px;font-weight:600;"><span>Ramesh Kumar</span><span>1 L</span></div>
                    <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #EADBC2;font-size:13px;font-weight:600;"><span>Sunita Devi</span><span>2 L</span></div>
                    <div style="display:flex;justify-content:space-between;padding:10px 0;font-size:13px;font-weight:600;"><span>Sharma Sweets</span><span>8 L</span></div>
                  </div>
                </div>
              </div>
            </div>
            <span class="phone-hint" data-i18n="openDemo">Open the live demo →</span>
          </a>
          <a href="#dues" class="float wa" style="position:absolute;left:0;bottom:80px;background:#728157;color:#F1F7E6;border-radius:18px;padding:14px 18px;transform:rotate(-5deg);box-shadow:0 20px 40px rgba(0,0,0,.35);">
            <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:.08em;">SENT ON WHATSAPP</p>
            <p style="margin:4px 0 0;font-size:22px;font-weight:800;display:flex;align-items:center;gap:8px;">₹1,240 ${check("currentColor")}</p>
          </a>
          <button type="button" class="float lang hd" data-lang-toggle aria-label="Switch the page between English and Hindi" style="position:absolute;right:8px;top:40px;background:#FDF0DA;color:#643312;border-radius:999px;padding:10px 16px;font-size:16px;transform:rotate(6deg);box-shadow:0 14px 30px rgba(0,0,0,.3);">हिंदी / EN</button>
        </div>
      </div>
    </section>

    <div class="band" style="background:#F6A06B;overflow:hidden;padding:16px 0;transform:rotate(-1deg);margin:0 -2%;">
      <div class="marquee" style="display:flex;width:max-content;white-space:nowrap;">
        ${[0, 1]
          .map(
            (k) => `<span class="hd" style="font-size:24px;padding:0 16px;color:#402310;"${k ? ' aria-hidden="true"' : ""}>${[0, 1]
              .map(
                () =>
                  `<a href="#round"${k ? ' tabindex="-1"' : ""}>Deliveries</a> ✦ <a href="#dues"${k ? ' tabindex="-1"' : ""}>Dues</a> ✦ <a href="#dues"${k ? ' tabindex="-1"' : ""}>WhatsApp bills</a> ✦ <a href="#counter"${k ? ' tabindex="-1"' : ""}>Walk-ins</a> ✦ <a href="#language"${k ? ' tabindex="-1"' : ""}>हिंदी / English</a> ✦ `,
              )
              .join("")}</span>`,
          )
          .join("")}
      </div>
    </div>

    <section id="features" class="wrap" style="padding-top:120px;padding-bottom:40px;scroll-margin-top:60px;">
      <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:44px;">
        <h2 class="hd h2" style="margin:0;font-size:52px;line-height:1.05;max-width:560px;" data-i18n-html="featH">Four things.<br><span style="color:#F6A06B;">Zero paperwork.</span></h2>
        <p class="muted" style="margin:0;max-width:380px;font-size:17px;line-height:1.6;" data-i18n="featP">Everything a dairy runs on, in the order you actually do it: the round, the dues, the counter, the bill. Go on — tap things.</p>
      </div>
      <div class="bento">
        <div id="round" data-reveal="f0" data-spot class="card span2" style="scroll-margin-top:90px;background:#3D472B;border:1px solid rgba(225,238,204,.14);border-radius:28px;padding:36px;display:flex;flex-wrap:wrap;gap:32px;align-items:center;">
          <div style="flex:1 1 260px;">
            <p style="margin:0;font-size:12px;font-weight:800;letter-spacing:.1em;color:#B7C99A;">01 · THE ROUND</p>
            <h3 style="margin:12px 0 10px;font-size:26px;font-weight:800;color:#F1F7E6;" data-i18n="f0h">Daily deliveries</h3>
            <p style="margin:0;font-size:16px;line-height:1.6;color:#CCDBB2;" data-i18n="f0p">Log a full day's deliveries in minutes. Quantities go in, running totals come out — automatically.</p>
            <a href="/demo" class="card-link" style="color:#E1EECC;"><span data-i18n="tryDemo">Try it in the demo</span> ${arrow}</a>
          </div>
          <div style="flex:1 1 240px;background:#2F3822;border-radius:20px;padding:8px 18px;">
            <p style="margin:8px 0 2px;font-size:11px;font-weight:800;letter-spacing:.08em;color:#B7C99A;"><span data-round-count>0</span> / 3 <span data-i18n="delivered">DELIVERED · TAP TO TICK</span></p>
            ${row("Priya Singh", "1.5 L", "sage")}${row("Mohd. Irfan", "3 L", "sage")}${row("Verma Tea Stall", "5 L", "sage")}
          </div>
        </div>

        <div id="dues" data-reveal="f1" data-spot class="card" style="scroll-margin-top:90px;background:#643312;border:1px solid rgba(255,198,165,.16);border-radius:28px;padding:36px;">
          <p style="margin:0;font-size:12px;font-weight:800;letter-spacing:.1em;color:#FFC6A5;">02 · THE DUES</p>
          <h3 style="margin:12px 0 10px;font-size:26px;font-weight:800;color:#FFE1D0;" data-i18n="f1h">Dues &amp; WhatsApp bills</h3>
          <p style="margin:0 0 22px;font-size:16px;line-height:1.6;color:#FFC6A5;" data-i18n="f1p">Balances update as you log. Send an itemised bill to WhatsApp when it's time to collect.</p>
          <div class="bill" data-bill><b>Shree Krishna Dairy</b><br>October · 31 L milk<br>Due: <b>₹1,860</b></div>
          <button type="button" class="send" data-send><span data-send-label>Send on WhatsApp</span></button>
        </div>

        <div id="counter" data-reveal="f2" data-spot class="card" style="scroll-margin-top:90px;background:#643312;border:1px solid rgba(255,198,165,.16);border-radius:28px;padding:36px;">
          <p style="margin:0;font-size:12px;font-weight:800;letter-spacing:.1em;color:#FFC6A5;">03 · THE COUNTER</p>
          <h3 style="margin:12px 0 10px;font-size:26px;font-weight:800;color:#FFE1D0;" data-i18n="f2h">Walk-in sales &amp; reports</h3>
          <p style="margin:0 0 22px;font-size:16px;line-height:1.6;color:#FFC6A5;" data-i18n="f2p">Counter sales sit right alongside your daily round. Daily and monthly totals, always clear.</p>
          <div class="chart" data-chart>${bars}</div>
          <p class="readout" data-readout aria-live="polite">Sat · ₹3,450</p>
        </div>

        <div id="language" data-reveal="f3" data-spot class="card span2" style="scroll-margin-top:90px;background:#34302A;border:1px solid rgba(253,240,218,.1);border-radius:28px;padding:36px;display:flex;flex-wrap:wrap;gap:32px;align-items:center;">
          <div style="flex:1 1 260px;">
            <p style="margin:0;font-size:12px;font-weight:800;letter-spacing:.1em;color:#F6A06B;">04 · YOUR LANGUAGE</p>
            <h3 style="margin:12px 0 10px;font-size:26px;font-weight:800;" data-i18n="f3h">English or Hindi</h3>
            <p class="muted" style="margin:0;font-size:16px;line-height:1.6;" data-i18n="f3p">Flip the whole app between languages with one tap — for you or anyone else running the counter. Try it: this page switches too.</p>
          </div>
          <div class="seg" role="group" aria-label="Language">
            <span class="knob" data-knob aria-hidden="true"></span>
            <button type="button" data-lang="en" aria-pressed="true">English</button>
            <button type="button" data-lang="hi" aria-pressed="false" class="hd" style="font-size:18px;">हिंदी</button>
          </div>
        </div>
      </div>
    </section>

    <section id="how" class="wrap" style="padding-top:120px;padding-bottom:40px;scroll-margin-top:60px;">
      <h2 class="hd h2" style="margin:0 0 52px;font-size:52px;text-align:center;" data-i18n="howH">Three steps in</h2>
      <div class="steps">
        <a href="/signup" data-reveal="s0" class="step">
          <span class="hd num">01</span>
          <h3 style="margin:12px 0 8px;font-size:20px;font-weight:800;" data-i18n="s0h">Set up your shop</h3>
          <p class="muted" style="margin:0;font-size:16px;line-height:1.6;" data-i18n="s0p">Add your products and rates.</p>
          <span class="go"><span data-i18n="startFree">Start free</span> ${arrow}</span>
        </a>
        <a href="/signup" data-reveal="s1" class="step">
          <span class="hd num">02</span>
          <h3 style="margin:12px 0 8px;font-size:20px;font-weight:800;" data-i18n="s1h">Add your customers</h3>
          <p class="muted" style="margin:0;font-size:16px;line-height:1.6;" data-i18n="s1p">Name, address, daily order.</p>
          <span class="go"><span data-i18n="startFree">Start free</span> ${arrow}</span>
        </a>
        <a href="/demo" data-reveal="s2" class="step">
          <span class="hd num">03</span>
          <h3 style="margin:12px 0 8px;font-size:20px;font-weight:800;" data-i18n="s2h">Log deliveries</h3>
          <p class="muted" style="margin:0;font-size:16px;line-height:1.6;" data-i18n="s2p">Dues update on their own.</p>
          <span class="go"><span data-i18n="seeIt">See it in action</span> ${arrow}</span>
        </a>
      </div>
    </section>

    <section id="free" class="wrap" style="padding-top:120px;padding-bottom:40px;scroll-margin-top:60px;">
      <div class="free-grid">
        <div>
          <h2 class="hd h2" style="margin:0;font-size:52px;line-height:1.05;" data-i18n-html="freeH">Free.<br>For every dairy.</h2>
          <p class="muted" style="margin:20px 0 0;max-width:420px;font-size:17px;line-height:1.6;" data-i18n="freeP">No plans, no trial clock, no card. Everything in Dairy Ledger is free for everyone.</p>
        </div>
        <div data-reveal="p0" class="free-card" style="background:#FDF0DA;color:#2E2B25;border-radius:32px;padding:40px;">
          <p style="margin:0;font-size:13px;font-weight:800;letter-spacing:.1em;color:#8C491A;" data-i18n="included">EVERYTHING INCLUDED</p>
          <p style="margin:10px 0 0;"><span class="hd" style="font-size:64px;line-height:1;">₹0</span></p>
          <div style="margin:26px 0;display:flex;flex-direction:column;gap:12px;font-size:16px;">
            <a href="#round" class="li" style="color:#2E2B25;">${check("#728157")}<span data-i18n="inc0">Daily delivery round &amp; running dues</span></a>
            <a href="#dues" class="li" style="color:#2E2B25;">${check("#728157")}<span data-i18n="inc1">WhatsApp bills &amp; reminders</span></a>
            <a href="#counter" class="li" style="color:#2E2B25;">${check("#728157")}<span data-i18n="inc2">Walk-in sales &amp; monthly reports</span></a>
            <a href="#language" class="li" style="color:#2E2B25;">${check("#728157")}<span data-i18n="inc3">English and Hindi</span></a>
          </div>
          <a href="/signup" class="dark-btn" data-i18n="startFree">Start free</a>
        </div>
      </div>
    </section>

    <section class="wrap" style="padding-top:120px;padding-bottom:100px;">
      <div data-reveal="c0" class="cta-box" style="background:#F6A06B;border-radius:36px;padding:80px 32px;text-align:center;color:#402310;position:relative;overflow:hidden;">
        <div class="ring2" style="position:absolute;top:-70px;left:-50px;width:220px;height:220px;border-radius:50%;border:2px dashed rgba(64,35,16,.25);"></div>
        <div class="ring2" style="position:absolute;bottom:-90px;right:-40px;width:260px;height:260px;border-radius:50%;border:2px dashed rgba(64,35,16,.2);"></div>
        <h2 class="hd h2" style="position:relative;margin:0;font-size:56px;line-height:1.05;" data-i18n="ctaH">Put the notebook down.</h2>
        <p style="position:relative;margin:16px 0 34px;font-size:18px;color:#643312;" data-i18n="ctaP">See it with real-looking data first, or set up your own dairy now.</p>
        <div style="position:relative;display:flex;flex-wrap:wrap;justify-content:center;gap:14px;">
          <a href="/demo" class="cta-dark">${play} <span data-i18n="seeIt">See it in action</span></a>
          <a href="/signup" class="cta-line" data-i18n="startFree">Start free</a>
        </div>
      </div>
    </section>

    <footer style="border-top:1px solid rgba(253,240,218,.1);">
      <div class="wrap" style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;padding-top:28px;padding-bottom:28px;font-size:14px;color:#9C9383;">
        <p style="margin:0;">© 2026 Dairy Ledger</p>
        <nav style="display:flex;flex-wrap:wrap;align-items:center;gap:22px;">
          <a href="/contact" class="ul">Contact</a>
          <a href="/terms" class="ul">Terms</a>
          <a href="/privacy" class="ul">Privacy</a>
          <a href="#top" class="to-top">Back to top ↑</a>
        </nav>
      </div>
    </footer>

  </div>`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <LandingReveal />
      <LandingInteractions />
    </>
  );
}
