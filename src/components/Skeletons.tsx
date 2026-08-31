// Themed skeleton building blocks shown while a page's data loads.
// Kept server-safe (no hooks) so they can be used directly in loading.tsx.

export function Bar({ w = "100%", h = 12, className = "" }: { w?: string | number; h?: number; className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-[var(--color-neutral-300)] ${className}`}
      style={{ width: w, height: h }}
    />
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{ borderColor: "var(--color-neutral-300)", background: "var(--color-neutral-100)" }}
    >
      {children}
    </div>
  );
}

function TitleRow() {
  return (
    <div className="flex items-center justify-between gap-3">
      <Bar w="40%" h={24} />
      <Bar w="30%" h={28} />
    </div>
  );
}

/** A few list rows (name + trailing amount). */
function Rows({ n = 5 }: { n?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <div className="flex-1 space-y-1.5">
            <Bar w="55%" h={14} />
            <Bar w="35%" h={10} />
          </div>
          <Bar w={64} h={16} />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <TitleRow />
      <div className="space-y-3">
        <Card>
          <Bar w="30%" h={12} />
          <div className="mt-3">
            <Bar w="45%" h={28} />
          </div>
        </Card>
        <Card>
          <Bar w="30%" h={12} />
          <div className="mt-3">
            <Bar w="45%" h={28} />
          </div>
        </Card>
      </div>
      <Card>
        <Bar w="40%" h={16} />
        <div className="mt-4 grid grid-cols-7 gap-2">
          {Array.from({ length: 28 }).map((_, i) => (
            <Bar key={i} h={28} />
          ))}
        </div>
      </Card>
    </div>
  );
}

/** The dashboard's data area only (stat cards + calendar + day summary),
 *  without the title/period toggle — used when changing period or date. */
export function DashboardBodySkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Card>
          <Bar w="30%" h={12} />
          <div className="mt-3">
            <Bar w="45%" h={28} />
          </div>
        </Card>
        <Card>
          <Bar w="30%" h={12} />
          <div className="mt-3">
            <Bar w="45%" h={28} />
          </div>
        </Card>
      </div>
      <Card>
        <Bar w="40%" h={16} />
        <div className="mt-4 grid grid-cols-7 gap-2">
          {Array.from({ length: 28 }).map((_, i) => (
            <Bar key={i} h={28} />
          ))}
        </div>
      </Card>
      <Card>
        <Bar w="35%" h={14} />
        <div className="mt-3">
          <Rows n={3} />
        </div>
      </Card>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="space-y-4">
      <Bar w="45%" h={24} />
      <Card>
        <Rows n={6} />
      </Card>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-5">
      <Bar w="30%" h={12} />
      <Bar w="55%" h={26} />
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <Bar w="60%" h={10} />
            <div className="mt-2">
              <Bar w="80%" h={20} />
            </div>
          </Card>
        ))}
      </div>
      <Card>
        <Bar w="50%" h={16} />
        <div className="mt-3">
          <Bar w={180} h={40} />
        </div>
      </Card>
    </div>
  );
}

export function DeliveriesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Bar w="40%" h={22} />
        <Bar w="70%" h={12} />
      </div>
      <div className="flex items-center justify-between">
        <Bar w={140} h={44} />
        <Bar w={80} h={36} />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <div className="mb-2 flex items-center justify-between">
              <Bar w="40%" h={14} />
              <Bar w={48} h={14} />
            </div>
            <div className="flex items-center gap-2">
              <Bar w="55%" h={12} />
              <Bar w={56} h={34} className="ml-auto" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
