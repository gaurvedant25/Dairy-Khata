import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LandingReveal } from "@/components/LandingReveal";

// Marketing landing page (Claude Design "Landing Wildcard"). Dark, playful,
// terracotta/sage on espresso. Logged-in visitors skip straight to the app.
export default async function Home() {
  const session = await auth();
  if (session) redirect("/dashboard");

  const CTA = "Start free trial";
  const PRICE = "₹249/month after trial · cancel anytime";

  const css = `
  .dl-heading{font-family:var(--font-heading),Georgia,serif;font-weight:400;}
  @keyframes dl-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
  @keyframes dl-spin-slow{from{transform:rotate(0)}to{transform:rotate(360deg)}}
  @keyframes dl-word-up{from{opacity:0;transform:translateY(28px) rotate(-1deg)}to{opacity:1;transform:none}}
  @keyframes dl-tilt{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}
  [data-reveal]{opacity:0;transform:translateY(28px) rotate(-1deg);transition:opacity .6s ease, transform .6s ease;}
  [data-reveal].is-visible{opacity:1;transform:none;}
  .dl-nav-cta{transition:all .2s ease;}
  .dl-nav-cta:hover{transform:rotate(-2deg) scale(1.05);background:#FFC6A5 !important;}
  .dl-btn-primary{transition:all .2s ease;}
  .dl-btn-primary:hover{transform:scale(1.06) rotate(-1deg);box-shadow:0 16px 30px rgba(246,160,107,.35);}
  .dl-btn-dark{transition:all .2s ease;}
  .dl-btn-dark:hover{transform:scale(1.06);box-shadow:0 16px 32px rgba(64,35,16,.35);}
  .dl-feat{transition:transform .25s ease;}
  .dl-feat:hover{transform:translateY(-6px) rotate(-1deg);}
  .dl-feat.tilt-r:hover{transform:translateY(-6px) rotate(1deg);}
  @media (max-width:900px){
    .dl-hero-grid{grid-template-columns:1fr !important;}
    .dl-hero-visual{display:none !important;}
    .dl-hero-h1{font-size:52px !important;}
    .dl-feat-grid{grid-template-columns:1fr !important;}
    .dl-steps-grid{grid-template-columns:1fr !important;gap:34px !important;}
    .dl-nav-secondary{display:none !important;}
  }
  @media (max-width:520px){ .dl-hero-h1{font-size:40px !important;} }
  @media (prefers-reduced-motion:reduce){
    [data-reveal]{opacity:1 !important;transform:none !important;}
    [style*="animation"]{animation:none !important;}
  }`;

  const html = `
  <div style="font-family: var(--font-body), system-ui, sans-serif; color: #FDF0DA; background: #2E2B25; min-height: 100vh; overflow-x: hidden;">

    <header style="max-width: 1160px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 24px 24px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="display: inline-block; height: 14px; width: 14px; border-radius: 50%; background: #D67F48; box-shadow: 0 0 0 4px rgba(214,127,72,0.25);"></span>
        <span class="dl-heading" style="font-size: 22px; color: #FDF0DA;">Dairy Ledger</span>
      </div>
      <nav style="display: flex; align-items: center; gap: 28px; font-size: 15px; font-weight: 700;">
        <a href="#features" class="dl-nav-secondary" style="color: #C0B6A5;">Features</a>
        <a href="#how" class="dl-nav-secondary" style="color: #C0B6A5;">How it works</a>
        <a href="/login" style="color: #F6A06B;">Sign in</a>
        <a href="/signup" class="dl-nav-cta" style="background: #D67F48; color: #2E2B25; padding: 10px 22px; border-radius: 999px; font-weight: 800;">${CTA}</a>
      </nav>
    </header>

    <main style="max-width: 1160px; margin: 0 auto; padding: 0 24px; position: relative;">

      <section style="padding: 64px 0 40px; position: relative;">
        <div style="position: absolute; top: -10px; right: -20px; width: 320px; height: 320px; border-radius: 50%; background: radial-gradient(circle, rgba(214,127,72,0.35), transparent 70%); pointer-events: none; z-index: 0;"></div>

        <div class="dl-hero-grid" style="display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 40px; align-items: center; position: relative; z-index: 1;">
          <div>
            <span style="display: inline-block; background: #728157; color: #E1EECC; font-size: 13px; font-weight: 800; padding: 7px 16px; border-radius: 999px; transform: rotate(-3deg); animation: dl-tilt 4s ease-in-out infinite;">NO MORE PAPER REGISTER</span>
            <h1 class="dl-heading dl-hero-h1" style="margin: 26px 0 0; font-size: 80px; line-height: 0.98; color: #FDF0DA;">
              <span style="display: block; animation: dl-word-up 0.6s ease both;">Ditch the</span>
              <span style="display: block; color: #F6A06B; animation: dl-word-up 0.6s 0.1s ease both;">notebook.</span>
              <span style="display: block; -webkit-text-stroke: 2px #FDF0DA; color: transparent; animation: dl-word-up 0.6s 0.2s ease both;">Run it live.</span>
            </h1>
            <p style="max-width: 460px; margin: 26px 0 0; font-size: 19px; line-height: 1.6; color: #C0B6A5; animation: dl-word-up 0.6s 0.3s ease both;">Every delivery, every rupee owed, every WhatsApp bill — tracked the second it happens. In English or Hindi.</p>
            <div style="margin-top: 34px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; animation: dl-word-up 0.6s 0.38s ease both;">
              <a href="/signup" class="dl-btn-primary" style="background: #F6A06B; color: #2E2B25; padding: 17px 32px; border-radius: 999px; font-weight: 800; font-size: 17px; display: inline-block;">${CTA} →</a>
              <a href="#features" style="color: #FDF0DA; font-weight: 700; font-size: 16px; border-bottom: 2px solid #F6A06B;">See it in action</a>
            </div>
            <p style="margin-top: 18px; font-size: 13px; color: #82796A;">${PRICE}</p>
          </div>

          <div class="dl-hero-visual" style="position: relative; height: 420px;">
            <div style="position: absolute; top: 0; right: 0; width: 100%; max-width: 300px; background: #FDF0DA; color: #402310; border-radius: 24px; padding: 24px; transform: rotate(4deg); box-shadow: 0 24px 50px rgba(0,0,0,0.35); animation: dl-tilt 6s ease-in-out infinite;">
              <p style="font-size: 12px; font-weight: 800; color: #8C491A; margin: 0 0 10px; letter-spacing: 0.04em;">TODAY'S DELIVERY</p>
              <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 700; padding: 8px 0; border-bottom: 1px solid #E0CB9E;"><span>Sharma Dairy</span><span>2L</span></div>
              <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 700; padding: 8px 0; border-bottom: 1px solid #E0CB9E;"><span>Patel Center</span><span>1.5L</span></div>
              <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 700; padding: 8px 0;"><span>Verma Store</span><span>3L</span></div>
            </div>
            <div style="position: absolute; bottom: 10px; left: 0; width: 220px; background: #728157; color: #E1EECC; border-radius: 20px; padding: 20px; transform: rotate(-6deg); box-shadow: 0 20px 40px rgba(0,0,0,0.3); animation: dl-tilt 5s 0.5s ease-in-out infinite;">
              <p style="font-size: 12px; font-weight: 800; margin: 0 0 6px; letter-spacing: 0.04em;">SENT ON WHATSAPP</p>
              <p style="font-size: 22px; font-weight: 900; margin: 0;">₹1,240 ✓</p>
            </div>
          </div>
        </div>
      </section>

      <div style="height: 20px;"></div>
    </main>

    <div style="background: #F6A06B; padding: 18px 0; overflow: hidden; transform: rotate(1deg); margin: 40px -4%;">
      <div style="display: flex; white-space: nowrap; width: max-content; animation: dl-marquee 18s linear infinite reverse;">
        <span class="dl-heading" style="font-size: 26px; color: #402310; padding: 0 24px;">DELIVERIES ★ DUES ★ WHATSAPP BILLS ★ WALK-INS ★ हिंदी / ENGLISH ★ DELIVERIES ★ DUES ★ WHATSAPP BILLS ★ WALK-INS ★ हिंदी / ENGLISH ★</span>
        <span class="dl-heading" style="font-size: 26px; color: #402310; padding: 0 24px;">DELIVERIES ★ DUES ★ WHATSAPP BILLS ★ WALK-INS ★ हिंदी / ENGLISH ★ DELIVERIES ★ DUES ★ WHATSAPP BILLS ★ WALK-INS ★ हिंदी / ENGLISH ★</span>
      </div>
    </div>

    <main style="max-width: 1160px; margin: 0 auto; padding: 0 24px;">

      <section id="features" style="padding: 60px 0 40px;">
        <h2 class="dl-heading" style="font-size: 40px; text-align: center; color: #FDF0DA; margin: 0 0 48px;">Four things. Zero paperwork.</h2>

        <div class="dl-feat-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px;">
          <div data-reveal="feat0" class="dl-feat" style="background: #3D472B; border: 2px solid #56633F; border-radius: 28px; padding: 36px;">
            <div style="width: 60px; height: 60px; background: #728157; border-radius: 16px; display: flex; flex-direction: column; gap: 5px; justify-content: center; padding: 0 16px;">
              <span style="height: 4px; border-radius: 2px; background: #E1EECC; width: 100%;"></span>
              <span style="height: 4px; border-radius: 2px; background: #E1EECC; width: 70%;"></span>
              <span style="height: 4px; border-radius: 2px; background: #E1EECC; width: 85%;"></span>
            </div>
            <h3 style="font-size: 20px; font-weight: 800; margin: 22px 0 8px; color: #E1EECC;">Daily deliveries</h3>
            <p style="font-size: 15px; line-height: 1.6; color: #CCDBB2; margin: 0;">Log a full day's deliveries in minutes. Quantities go in, running totals come out — automatically.</p>
          </div>

          <div data-reveal="feat1" class="dl-feat tilt-r" style="background: #643312; border: 2px solid #8C491A; border-radius: 28px; padding: 36px;">
            <div style="width: 60px; height: 60px; background: #B2622D; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; color: #FFE1D0;">₹</div>
            <h3 style="font-size: 20px; font-weight: 800; margin: 22px 0 8px; color: #FFE1D0;">Dues &amp; WhatsApp billing</h3>
            <p style="font-size: 15px; line-height: 1.6; color: #FFC6A5; margin: 0;">Balances update as you log deliveries. Send an itemised bill straight to WhatsApp when it's time to collect.</p>
          </div>

          <div data-reveal="feat2" class="dl-feat" style="background: #643312; border: 2px solid #8C491A; border-radius: 28px; padding: 36px;">
            <div style="width: 60px; height: 60px; background: #B2622D; border-radius: 16px; display: flex; align-items: flex-end; gap: 5px; justify-content: center; padding: 12px;">
              <span style="width: 9px; height: 14px; background: #FFE1D0; border-radius: 2px;"></span>
              <span style="width: 9px; height: 26px; background: #FFE1D0; border-radius: 2px;"></span>
              <span style="width: 9px; height: 18px; background: #FFE1D0; border-radius: 2px;"></span>
            </div>
            <h3 style="font-size: 20px; font-weight: 800; margin: 22px 0 8px; color: #FFE1D0;">Walk-in sales &amp; reports</h3>
            <p style="font-size: 15px; line-height: 1.6; color: #FFC6A5; margin: 0;">Counter sales sit right alongside subscriptions. Daily and monthly totals, always clear.</p>
          </div>

          <div data-reveal="feat3" class="dl-feat tilt-r" style="background: #3D472B; border: 2px solid #56633F; border-radius: 28px; padding: 36px;">
            <div style="width: 60px; height: 60px; background: #728157; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; color: #E1EECC;">A / अ</div>
            <h3 style="font-size: 20px; font-weight: 800; margin: 22px 0 8px; color: #E1EECC;">English or Hindi</h3>
            <p style="font-size: 15px; line-height: 1.6; color: #CCDBB2; margin: 0;">Flip the whole app between languages with one tap — for you or anyone else running the counter.</p>
          </div>
        </div>
      </section>

      <section id="how" style="padding: 80px 0;">
        <h2 class="dl-heading" style="font-size: 40px; text-align: center; color: #FDF0DA; margin: 0 0 48px;">Three steps in</h2>
        <div class="dl-steps-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;">
          <div data-reveal="step0" style="text-align: center;">
            <span class="dl-heading" style="display: block; font-size: 56px; color: #F6A06B;">01</span>
            <h3 style="font-size: 17px; font-weight: 800; margin: 8px 0 6px; color: #FDF0DA;">Set up your shop</h3>
            <p style="font-size: 14px; line-height: 1.6; color: #A19786; margin: 0;">Add your products and rates.</p>
          </div>
          <div data-reveal="step1" style="text-align: center;">
            <span class="dl-heading" style="display: block; font-size: 56px; color: #F6A06B;">02</span>
            <h3 style="font-size: 17px; font-weight: 800; margin: 8px 0 6px; color: #FDF0DA;">Add your customers</h3>
            <p style="font-size: 14px; line-height: 1.6; color: #A19786; margin: 0;">Name, address, daily order.</p>
          </div>
          <div data-reveal="step2" style="text-align: center;">
            <span class="dl-heading" style="display: block; font-size: 56px; color: #F6A06B;">03</span>
            <h3 style="font-size: 17px; font-weight: 800; margin: 8px 0 6px; color: #FDF0DA;">Log deliveries</h3>
            <p style="font-size: 14px; line-height: 1.6; color: #A19786; margin: 0;">Dues update on their own.</p>
          </div>
        </div>
      </section>

      <section data-reveal="cta" style="padding: 40px 0 90px; text-align: center;">
        <div style="background: #F6A06B; border-radius: 32px; padding: 70px 40px; position: relative; overflow: hidden;">
          <div style="position: absolute; top: -50px; left: -30px; width: 200px; height: 200px; border-radius: 50%; border: 3px dashed rgba(64,35,16,0.25); animation: dl-spin-slow 20s linear infinite;"></div>
          <h2 class="dl-heading" style="font-size: 40px; margin: 0 0 12px; color: #402310; position: relative; z-index: 1;">Put the notebook down.</h2>
          <p style="font-size: 17px; color: #643312; margin: 0 0 30px; position: relative; z-index: 1;">Start today, no card required.</p>
          <a href="/signup" class="dl-btn-dark" style="position: relative; z-index: 1; background: #402310; color: #FDF0DA; padding: 17px 34px; border-radius: 999px; font-weight: 800; font-size: 17px; display: inline-block;">${CTA} →</a>
          <p style="margin-top: 18px; font-size: 13px; color: #8C491A; position: relative; z-index: 1;">${PRICE}</p>
        </div>
      </section>

    </main>

    <footer style="border-top: 2px solid #3D472B;">
      <div style="max-width: 1160px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 26px 24px; font-size: 14px; color: #82796A; flex-wrap: wrap;">
        <p style="margin: 0;">© 2026 Dairy Ledger</p>
        <nav style="display: flex; flex-wrap: wrap; align-items: center; gap: 20px;">
          <a href="/pricing" style="color: #A19786;">Pricing</a>
          <a href="/contact" style="color: #A19786;">Contact</a>
          <a href="/terms" style="color: #A19786;">Terms</a>
          <a href="/privacy" style="color: #A19786;">Privacy</a>
          <a href="/refund" style="color: #A19786;">Refunds</a>
        </nav>
      </div>
    </footer>

  </div>`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <LandingReveal />
    </>
  );
}
