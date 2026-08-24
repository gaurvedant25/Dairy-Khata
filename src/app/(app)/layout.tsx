import { auth } from "@/lib/auth";
import { NavLinks } from "@/components/NavLinks";
import { SignOutButton } from "@/components/SignOutButton";
import { PageTransition } from "@/components/PageTransition";

function Wordmark() {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#9D6638]" aria-hidden />
      <span className="text-base font-semibold tracking-tight text-[#4E220F]">Dairy Ledger</span>
    </div>
  );
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="hidden w-60 shrink-0 border-r border-[#E0CB9E] bg-[#FBF3D1] p-4 md:flex md:flex-col">
        <div className="mb-6 px-2">
          <Wordmark />
          <p className="mt-1 truncate text-xs text-slate-500">{session?.user?.name}</p>
        </div>
        <NavLinks orientation="vertical" />
        <div className="mt-auto px-2 pt-4">
          <SignOutButton />
        </div>
      </aside>

      <header className="flex items-center justify-between border-b border-[#E0CB9E] bg-[#FBF3D1] px-4 py-3 md:hidden">
        <Wordmark />
        <SignOutButton />
      </header>

      <main className="flex-1 pb-24 md:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 border-t border-[#E0CB9E] bg-[#FBF3D1] md:hidden">
        <NavLinks orientation="horizontal" />
      </nav>
    </div>
  );
}
