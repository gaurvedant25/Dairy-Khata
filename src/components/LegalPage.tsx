import Link from "next/link";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#9D6638]" aria-hidden />
          <span className="text-lg font-semibold tracking-tight text-[#4E220F]">Dairy Ledger</span>
        </Link>
        <Link href="/" className="text-sm font-medium text-[#9D6638] hover:underline">
          ← Home
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-16">
        <h1 className="mb-6 text-2xl font-bold text-[#4E220F]">{title}</h1>
        <div className="space-y-4 text-sm leading-relaxed text-slate-700 [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-[#4E220F]">
          {children}
        </div>
      </main>
    </div>
  );
}
