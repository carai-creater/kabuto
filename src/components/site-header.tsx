import Link from "next/link";
import { PAGE_SHELL } from "@/lib/page-shell";
import { SiteHeaderNav } from "@/components/site-header-nav";
import { ThemeToggle } from "@/components/theme-toggle";

type Props = {
  displayName?: string | null;
  email?: string | null;
  balancePt?: number | null;
  configWarning?: string | null;
  /** デモページへのリンクを出すか（本番では false になりやすい） */
  demoLoginEnabled?: boolean;
  /** role が creator のとき「クリエイター管理画面」 */
  showCreatorAdminLink?: boolean;
  /** role が admin のとき「管理者」 */
  showAdminLink?: boolean;
};

export function SiteHeader({
  displayName,
  email,
  balancePt,
  configWarning,
  demoLoginEnabled = true,
  showCreatorAdminLink = false,
  showAdminLink = false,
}: Props) {
  return (
    <header
      className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--header-bg)] backdrop-blur-md backdrop-saturate-150"
    >
      <div
        className={`flex h-[52px] w-full items-center gap-4 sm:h-14 sm:gap-8 lg:gap-12 ${PAGE_SHELL}`}
      >
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
        >
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] dark:bg-[var(--card)]">
            <img
              src="/kabuto-logo-light.png"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 object-contain dark:hidden"
            />
            <img
              src="/kabuto-logo-dark.png"
              alt=""
              width={32}
              height={32}
              className="hidden h-8 w-8 object-contain dark:block"
            />
          </span>
          <span className="text-[17px] font-bold tracking-tight text-[#333333] dark:text-[var(--foreground)]">
            kabuto
          </span>
        </Link>

        {configWarning && (
          <p className="hidden min-w-0 flex-1 truncate px-1 text-center text-[11px] text-[var(--muted)] sm:block">
            {configWarning}
          </p>
        )}

        <div className="ml-auto flex min-w-0 shrink-0 items-center gap-2 sm:gap-3 lg:gap-4">
          <SiteHeaderNav
            demoLoginEnabled={demoLoginEnabled}
            showAdminLink={showAdminLink}
            showCreatorAdminLink={showCreatorAdminLink}
            email={email}
          />
          {balancePt != null && (
            <span
              className="tabular-nums text-[12px] font-medium text-[var(--subtle)] sm:text-[13px] sm:px-1"
              title="残高"
            >
              {balancePt.toLocaleString("ja-JP")}
              <span className="text-[var(--muted)]"> pt</span>
            </span>
          )}
          {email && (
            <span className="hidden max-w-[8rem] truncate text-[12px] text-[var(--muted)] lg:inline">
              {displayName ?? email}
            </span>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
