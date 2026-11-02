import { auth } from "@/lib/auth";
import { getLang } from "@/lib/lang";
import { NavLinks } from "@/components/NavLinks";
import { SignOutButton } from "@/components/SignOutButton";
import { PageTransition } from "@/components/PageTransition";
import { prisma } from "@/lib/prisma";
import { isDemoUsername } from "@/lib/demo";

// Pinned to the top of every screen while a visitor explores the demo. Plain
// <a> links (not <Link>) so the exit route is never prefetched.
function DemoBanner() {
  return (
    <div
      className="sticky top-0 z-40 flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 text-[13.5px]"
      style={{ background: "var(--color-peach-bg)", color: "var(--color-peach-fg)" }}
    >
      <a href="/demo/exit" className="inline-flex items-center gap-1 font-semibold hover:underline">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M19 12H5" />
          <path d="m11 18-6-6 6-6" />
        </svg>
        Back
      </a>
      <span className="min-w-0 flex-1">
        <b>Demo mode</b> · sample data from the last 2 months
      </span>
      <a
        href="/demo/exit?to=signup"
        className="rounded-full px-4 py-1.5 font-bold"
        style={{ background: "var(--color-accent-500)", color: "#fff" }}
      >
        Create my account
      </a>
    </div>
  );
}

function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="inline-block h-[11px] w-[11px] shrink-0 rounded-full"
        style={{ background: "var(--color-accent-500)" }}
        aria-hidden
      />
      <span className="font-heading text-[19px] tracking-tight text-[var(--color-accent-900)]">Dairy Ledger</span>
    </div>
  );
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const lang = await getLang();

  const account = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { username: true },
  });
  const isDemo = isDemoUsername(account?.username);

  return (
    <>
    {isDemo && <DemoBanner />}
    <div className="relative flex min-h-screen flex-col md:flex-row">
      <aside
        className="hidden w-60 shrink-0 border-r p-4 md:flex md:flex-col"
        style={{ borderColor: "var(--color-divider)", background: "var(--color-neutral-100)" }}
      >
        <div className="mb-6 px-2">
          <Wordmark />
          <p className="mt-1 truncate text-xs text-[var(--color-neutral-600)]">{session?.user?.name}</p>
        </div>
        <NavLinks orientation="vertical" lang={lang} />
        <div className="mt-auto px-2 pt-4">
          <SignOutButton />
        </div>
      </aside>

      {/* overflow-x-hidden keeps the decorative bloom from widening the page */}
      <main className="relative flex-1 overflow-x-hidden pb-28 md:pb-0">
        {/* Soft accent bloom behind the top of the screen */}
        <div
          className="pointer-events-none absolute -right-[90px] -top-[120px] h-[280px] w-[280px] rounded-full md:hidden"
          style={{ background: "var(--color-bloom)", opacity: 0.75 }}
          aria-hidden
        />

        <header className="relative flex items-center gap-2.5 px-5 pb-2.5 pt-[18px] md:hidden">
          <Wordmark />
          <div className="ml-auto">
            <SignOutButton />
          </div>
        </header>


        <div className="relative mx-auto max-w-5xl px-4 py-4 md:py-8">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 md:hidden"
        style={{
          background: "var(--color-neutral-100)",
          borderRadius: "28px 28px 0 0",
          boxShadow: "0 -6px 24px rgba(46,43,37,.10)",
        }}
      >
        <NavLinks orientation="horizontal" lang={lang} />
      </nav>
    </div>
    </>
  );
}
