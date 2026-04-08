"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Settings,
  Shield,
  Sparkles,
  Wallet,
} from "lucide-react";

const baseNav = [
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

const adminNavItem = {
  href: "/dashboard/admin",
  label: "管理",
  icon: Shield,
} as const;

export function DashboardShell({
  children,
  isAdmin = false,
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const nav = isAdmin ? [...baseNav, adminNavItem] : [...baseNav];

  return (
    <div className="flex min-h-[calc(100vh-52px)] w-full flex-col md:flex-row">
      <aside className="shrink-0 border-b border-slate-200 bg-white md:w-[11.5rem] md:border-b-0 md:border-r md:border-slate-200 dark:border-slate-800 dark:bg-slate-950">
        <div className="px-4 py-5 md:px-3 md:py-8">
          <p className="mb-4 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 md:mb-5">
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
                    : item.href === "/dashboard/admin"
                      ? pathname === "/dashboard/admin" ||
                        pathname.startsWith("/dashboard/admin/")
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  className={`touch-manipulation flex shrink-0 items-center gap-3 rounded-r-lg border-l-4 py-2.5 pl-3 pr-2.5 text-[13px] font-medium transition [-webkit-tap-highlight-color:transparent] md:min-w-0 ${
                    active
                      ? "border-blue-600 bg-blue-50 text-slate-900 shadow-sm dark:border-blue-500 dark:bg-slate-800/90 dark:text-white"
                      : "border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
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
