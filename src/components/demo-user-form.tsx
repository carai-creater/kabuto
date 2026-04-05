"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  wallet: { balancePt: number } | null;
};

export function DemoUserForm({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  return (
    <ul className="mt-10 space-y-3">
      {users.map((u) => (
        <li key={u.id}>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setErr(null);
              startTransition(async () => {
                const res = await fetch("/api/auth/demo", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ userId: u.id }),
                });
                if (!res.ok) {
                  setErr("切り替えに失敗しました。");
                  return;
                }
                router.refresh();
              });
            }}
            className="surface-card flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:border-[var(--accent)]/30 disabled:opacity-50"
          >
            <span>
              <span className="block text-[17px] font-medium text-foreground">
                {u.name ?? u.email}
              </span>
              <span className="text-[13px] text-[var(--muted)]">{u.email}</span>
            </span>
            <span className="shrink-0 text-[15px] font-semibold tabular-nums text-[var(--brand)]">
              {(u.wallet?.balancePt ?? 0).toLocaleString("ja-JP")} pt
            </span>
          </button>
        </li>
      ))}
      {err && (
        <p className="text-[15px] text-[var(--destructive)]" role="alert">
          {err}
        </p>
      )}
    </ul>
  );
}
