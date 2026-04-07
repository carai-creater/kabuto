"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { PAGE_SHELL } from "@/lib/page-shell";
import {
  LayoutDashboard,
  Settings,
  Sparkles,
  Wallet,
} from "lucide-react";

const nav = [
  {
    href: "/dashboard",
    label: "マイページ",
    icon: LayoutDashboard,
  },
  {
    href: "/wallet",
    label: "ウォレット",
    icon: Wallet,
  },
  {
    href: "/dashboard/creator",
    label: "クリエイター",
    icon: Sparkles,
  },
  {
    href: "/dashboard/settings",
    label: "設定",
    icon: Settings,
  },
] as const;

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div
      className={`dark flex min-h-[calc(100vh-52px)] flex-col md:flex-row ${PAGE_SHELL}`}
    >
      <aside className="shrink-0 border-b border-[var(--border)] bg-[var(--card)]/80 py-4 backdrop-blur-md md:w-56 md:border-b-0 md:border-r md:py-8 md:pr-4">
        <p className="mb-4 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)] md:mb-6">
          メニュー
        </p>
        <nav className="flex flex-row gap-1 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
          {nav.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : item.href === "/dashboard/settings"
                  ? pathname === "/dashboard/settings" ||
                    pathname.startsWith("/dashboard/settings/")
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] font-medium transition md:shrink ${
                  active
                    ? "bg-[var(--brand-muted)] text-[var(--accent)] ring-1 ring-[var(--accent)]/25"
                    : "text-foreground hover:bg-[var(--card-elevated)]"
                }`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0 flex-1 py-6 md:py-8 md:pl-4">{children}</div>
    </div>
  );
}
