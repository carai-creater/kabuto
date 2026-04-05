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
    <ul className="mt-8 space-y-3">
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
            className="flex w-full items-center justify-between gap-4 rounded-2xl border border-white/10 bg-zinc-950/50 px-4 py-3 text-left text-sm transition hover:border-[#D4AF37]/35 hover:bg-zinc-900/60 disabled:opacity-50"
          >
            <span>
              <span className="block font-medium text-zinc-100">
                {u.name ?? u.email}
              </span>
              <span className="text-xs text-zinc-500">{u.email}</span>
            </span>
            <span className="shrink-0 tabular-nums text-[#E8D48B]">
              {(u.wallet?.balancePt ?? 0).toLocaleString("ja-JP")} pt
            </span>
          </button>
        </li>
      ))}
      {err && <p className="text-sm text-red-400">{err}</p>}
    </ul>
  );
}
