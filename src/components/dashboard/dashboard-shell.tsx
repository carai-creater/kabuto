import Link from "next/link";

import { PAGE_SHELL } from "@/lib/page-shell";
import {
  Home,
  LayoutDashboard,
  Search,
  Settings,
  Sparkles,
  Wallet,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const mainNav: NavItem[] = [
  {
    href: "/dashboard",
    label: "ホーム",
    icon: <LayoutDashboard className="h-[18px] w-[18px] shrink-0" aria-hidden />,
  },
  {
    href: "/",
    label: "エージェントを探す",
    icon: <Search className="h-[18px] w-[18px] shrink-0" aria-hidden />,
  },
  {
    href: "/wallet",
    label: "ウォレット",
    icon: <Wallet className="h-[18px] w-[18px] shrink-0" aria-hidden />,
  },
  {
    href: "/dashboard/settings",
    label: "設定",
    icon: <Settings className="h-[18px] w-[18px] shrink-0" aria-hidden />,
  },
];

type Props = {
  children: React.ReactNode;
  isCreator: boolean;
};

export function DashboardShell({ children, isCreator }: Props) {
  return (
    <div
      className={`dark flex min-h-[calc(100vh-52px)] flex-col md:flex-row ${PAGE_SHELL}`}
    >
      <aside className="shrink-0 border-b border-[var(--border)] bg-[var(--card)]/80 py-4 backdrop-blur-md md:w-60 md:border-b-0 md:border-r md:py-8 md:pr-4">
        <div className="mb-4 flex items-center gap-2 px-1 md:mb-6">
          <Home className="h-5 w-5 text-[var(--accent)]" aria-hidden />
          <span className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
            メニュー
          </span>
        </div>
        <nav className="flex flex-row gap-1 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] font-medium text-foreground transition hover:bg-[var(--card-elevated)] md:shrink"
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
        {isCreator ? (
          <div className="mt-6 border-t border-[var(--border)] pt-6">
            <Link
              href="/dashboard/creator"
              className="flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-center text-[14px] font-semibold text-white shadow-lg shadow-[var(--accent)]/25 transition hover:opacity-95"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              クリエイターダッシュボードへ
            </Link>
          </div>
        ) : null}
      </aside>
      <div className="min-w-0 flex-1 py-6 md:py-8 md:pl-2">{children}</div>
    </div>
  );
}
