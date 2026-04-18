import Link from "next/link";
import { PAGE_SHELL } from "@/lib/page-shell";

const LINKS = [
  {
    heading: "kabuto",
    items: [
      { label: "エージェントを探す", href: "/agents" },
      { label: "エージェントを作る", href: "/dashboard/creator/new" },
      { label: "マイページ", href: "/dashboard" },
    ],
  },
  {
    heading: "サービス",
    items: [
      { label: "kabuto について", href: "/about" },
      { label: "料金・ポイント", href: "/wallet" },
    ],
  },
  {
    heading: "法的情報",
    items: [
      { label: "利用規約", href: "/terms" },
      { label: "プライバシーポリシー", href: "/privacy" },
    ],
  },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--card)] py-12">
      <div className={PAGE_SHELL}>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4">
          {/* ブランド */}
          <div className="col-span-2 sm:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2 outline-none"
            >
              <span className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                <img src="/kabuto-logo-light.png" alt="" width={28} height={28} className="h-7 w-7 object-contain dark:hidden" />
                <img src="/kabuto-logo-dark.png" alt="" width={28} height={28} className="hidden h-7 w-7 object-contain dark:block" />
              </span>
              <span className="text-[16px] font-semibold tracking-tight text-[var(--foreground)]">kabuto</span>
            </Link>
            <p className="mt-3 max-w-[200px] text-[13px] leading-relaxed text-[var(--muted)]">
              誰でも使える AI エージェントのマーケットプレイス。繰り返しの仕事を自動化しよう。
            </p>
          </div>

          {LINKS.map((col) => (
            <div key={col.heading}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                {col.heading}
              </p>
              <ul className="mt-4 space-y-3">
                {col.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-[13px] text-[var(--subtle)] transition hover:text-[var(--foreground)]"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-[var(--border)] pt-8 sm:flex-row sm:items-center">
          <p className="text-[12px] text-[var(--muted)]">
            © {year} kabuto. All rights reserved. 運営:{" "}
            <Link
              href="https://carai.homes"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-[var(--foreground)]"
            >
              carai
            </Link>
          </p>
          <p className="text-[12px] text-[var(--muted)]">
            Powered by{" "}
            <span className="text-[var(--foreground)]">GPT-4o</span>{" "}
            &{" "}
            <span className="text-[var(--foreground)]">Claude</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
