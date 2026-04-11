import { PAGE_SHELL } from "@/lib/page-shell";

function CardSkeleton() {
  return (
    <div className="h-[280px] animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm sm:p-6">
      <div className="flex gap-4">
        <div className="h-14 w-14 shrink-0 rounded-2xl bg-[var(--background-muted)]" />
        <div className="flex-1 space-y-3">
          <div className="h-5 w-3/4 rounded-md bg-[var(--background-muted)]" />
          <div className="h-4 w-full rounded-md bg-[var(--background-muted)]" />
          <div className="h-4 w-5/6 rounded-md bg-[var(--background-muted)]" />
        </div>
      </div>
      <div className="mt-6 flex gap-2">
        <div className="h-6 w-16 rounded-full bg-[var(--background-muted)]" />
        <div className="h-6 w-20 rounded-full bg-[var(--background-muted)]" />
      </div>
      <div className="mt-6 border-t border-[var(--border)] pt-4">
        <div className="h-4 w-40 rounded bg-[var(--background-muted)]" />
      </div>
      <div className="mt-4 flex justify-between">
        <div className="h-6 w-24 rounded bg-[var(--background-muted)]" />
        <div className="h-10 w-24 rounded-full bg-[var(--background-muted)]" />
      </div>
    </div>
  );
}

export default function HomeLoading() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-gradient-to-b from-white to-[var(--background)] dark:from-[var(--card)] dark:to-[var(--background)]">
        <div className={`${PAGE_SHELL} py-12 sm:py-16`}>
          <div className="mx-auto max-w-4xl space-y-4 text-center">
            <div className="mx-auto h-4 w-40 animate-pulse rounded bg-[var(--background-muted)]" />
            <div className="mx-auto h-10 max-w-lg animate-pulse rounded-lg bg-[var(--background-muted)]" />
            <div className="mx-auto h-5 max-w-md animate-pulse rounded bg-[var(--background-muted)]" />
          </div>
        </div>
      </header>
      <div className={`${PAGE_SHELL} py-10`}>
        <div className="mx-auto mb-10 h-14 max-w-2xl animate-pulse rounded-full bg-[var(--card)] shadow-inner ring-1 ring-[var(--border)]" />
        <div className="mx-auto mb-4 h-8 w-48 animate-pulse rounded bg-[var(--background-muted)]" />
        <ul className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i}>
              <CardSkeleton />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
