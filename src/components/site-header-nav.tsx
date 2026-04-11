"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  if (href === "/dashboard/admin") {
    return pathname.startsWith("/dashboard/admin");
  }
  if (href === "/dashboard/creator") {
    return pathname.startsWith("/dashboard/creator");
  }
  if (href === "/wallet") {
    return pathname === "/wallet" || pathname.startsWith("/wallet/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  matchHref,
  children,
  title,
}: {
  href: string;
  /** アクティブ判定に使うパス（未ログイン時は login?next= になるため別指定） */
  matchHref?: string;
  children: ReactNode;
  title?: string;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, matchHref ?? href);

  return (
    <Link
      href={href}
      title={title}
      className={`rounded-full px-2 py-1.5 text-[12px] transition sm:px-3 sm:text-[13px] ${
        active
          ? "font-bold text-[#333333] underline decoration-2 underline-offset-[6px] [text-decoration-color:var(--accent)] dark:text-[var(--foreground)]"
          : "font-medium text-[var(--muted)] hover:text-[#333333] dark:hover:text-[var(--foreground)]"
      }`}
    >
      {children}
    </Link>
  );
}

type Props = {
  demoLoginEnabled?: boolean;
  showCreatorAdminLink?: boolean;
  showAdminLink?: boolean;
  email?: string | null;
};

export function SiteHeaderNav({
  demoLoginEnabled = true,
  showCreatorAdminLink = false,
  showAdminLink = false,
  email,
}: Props) {
  const loggedIn = Boolean(email);

  return (
    <nav className="flex flex-wrap items-center justify-end gap-x-1 gap-y-1 sm:gap-x-2">
      <NavLink
        href={loggedIn ? "/dashboard" : "/login?next=%2Fdashboard"}
        matchHref="/dashboard"
      >
        マイページ
      </NavLink>
      <NavLink
        href={loggedIn ? "/wallet" : "/login?next=%2Fwallet"}
        matchHref="/wallet"
      >
        ウォレット
      </NavLink>
      {showAdminLink ? (
        <NavLink href="/dashboard/admin" title="ユーザーロール管理">
          <span className="hidden sm:inline">管理者</span>
          <span className="sm:hidden">管理</span>
        </NavLink>
      ) : null}
      {showCreatorAdminLink ? (
        <NavLink href="/dashboard/creator" title="クリエイター管理画面">
          <span className="hidden sm:inline">クリエイター管理画面</span>
          <span className="sm:hidden">クリエイター</span>
        </NavLink>
      ) : null}
      {demoLoginEnabled ? <NavLink href="/demo">デモ</NavLink> : null}
      {email ? (
        <form action="/auth/signout" method="post" className="inline">
          <button
            type="submit"
            className="rounded-full px-2 py-1.5 text-[12px] font-medium text-[var(--muted)] transition hover:text-[#333333] sm:px-3 sm:text-[13px] dark:hover:text-[var(--foreground)]"
          >
            ログアウト
          </button>
        </form>
      ) : (
        <NavLink href="/login">ログイン</NavLink>
      )}
    </nav>
  );
}
