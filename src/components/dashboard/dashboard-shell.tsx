"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
    <div className="flex min-h-[calc(100vh-52px)] w-full flex-col md:flex-row">
      <aside className="shrink-0 border-b border-slate-800 bg-slate-900 md:w-48 md:border-b-0 md:border-r md:border-slate-800">
        <div className="px-4 py-5 md:px-3 md:py-8">
          <p className="mb-4 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 md:mb-5">
            メニュー
          </p>
          <nav className="flex flex-row gap-0.5 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0 md:pr-0">
            {nav.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : item.href === "/dashboard/settings"
                    ? pathname === "/dashboard/settings" ||
                      pathname.startsWith("/dashboard/settings/")
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex shrink-0 items-center gap-3 rounded-r-lg border-l-4 py-2.5 pl-3 pr-2.5 text-[13px] font-medium transition md:min-w-0 ${
                    active
                      ? "border-blue-500 bg-slate-800/95 text-white shadow-sm"
                      : "border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                  }`}
                >
                  <Icon
                    className="h-[18px] w-[18px] shrink-0 opacity-90"
                    strokeWidth={active ? 2.25 : 2}
                    aria-hidden
                  />
                  <span className="whitespace-nowrap">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
      <div className="min-w-0 flex-1 bg-slate-50 dark:bg-black">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          {children}
        </div>
      </div>
    </div>
  );
}
