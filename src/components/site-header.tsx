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
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--header-bg)] backdrop-blur-lg">
      <div className={`flex h-14 w-full items-center gap-6 ${PAGE_SHELL}`}>
        {/* ロゴ */}
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2 outline-none"
        >
          <span className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg">
            <img src="/kabuto-logo-light.png" alt="" width={28} height={28} className="h-7 w-7 object-contain dark:hidden" />
            <img src="/kabuto-logo-dark.png" alt="" width={28} height={28} className="hidden h-7 w-7 object-contain dark:block" />
          </span>
          <span className="text-[16px] font-semibold tracking-tight text-[var(--foreground)]">
            kabuto
          </span>
        </Link>

        {configWarning && (
          <p className="hidden min-w-0 flex-1 truncate text-center text-[11px] text-[var(--muted)] sm:block">
            {configWarning}
          </p>
        )}

        <div className="ml-auto flex items-center gap-1">
          <SiteHeaderNav
            demoLoginEnabled={demoLoginEnabled}
            showAdminLink={showAdminLink}
            showCreatorAdminLink={showCreatorAdminLink}
            email={email}
          />
          {balancePt != null && (
            <span className="ml-1 rounded-full bg-[var(--brand-muted)] px-3 py-1 text-[12px] font-semibold tabular-nums text-[var(--accent)]" title="残高">
              {balancePt.toLocaleString("ja-JP")} pt
            </span>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
