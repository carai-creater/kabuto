"use client";

import { useState } from "react";
import { POINT_PACKAGES, type PointPackageId } from "@/lib/stripe/packages";

export function BuyPointsPanel() {
  const [selected, setSelected] = useState<PointPackageId>("pt_1000");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBuy() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: selected }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "エラーが発生しました。");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {POINT_PACKAGES.map((pkg) => (
          <button
            key={pkg.id}
            type="button"
            onClick={() => setSelected(pkg.id)}
            className={`rounded-2xl border p-5 text-left transition ${
              selected === pkg.id
                ? "border-[var(--accent)] bg-[var(--brand-muted)] ring-1 ring-[var(--accent)]"
                : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--border-strong)]"
            }`}
          >
            <p className="text-[22px] font-bold tabular-nums text-[var(--brand)]">
              {pkg.label}
            </p>
            <p className="mt-1 text-[15px] font-semibold text-foreground">
              ¥{pkg.amountYen.toLocaleString("ja-JP")}
            </p>
            {pkg.bonus && (
              <p className="mt-1.5 text-[12px] font-medium text-emerald-600 dark:text-emerald-400">
                {pkg.bonus}
              </p>
            )}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-3 text-[14px] text-[var(--destructive)]" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={loading}
        onClick={() => void handleBuy()}
        className="btn-primary mt-5 w-full sm:w-auto"
      >
        {loading ? "処理中…" : "Stripe で購入する"}
      </button>

      <p className="mt-3 text-[12px] text-[var(--muted)]">
        Stripe の安全な決済ページに遷移します。購入後にポイントが追加されます。
      </p>
    </div>
  );
}
