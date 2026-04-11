/** DB 接続のよくあるミス */
export function DbConnectionTips() {
  return (
    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-left text-[13px] text-[var(--muted)]">
      <li>
        接続 URL は{" "}
        <code className="rounded bg-[var(--card-elevated)] px-1 py-0.5 text-[12px] ring-1 ring-[var(--border)]">
          postgresql://
        </code>{" "}
        始まり（Supabase ダッシュボードの{" "}
        <code className="rounded bg-[var(--card-elevated)] px-1 py-0.5 text-[12px]">https://</code>{" "}
        プロジェクト URL ではない）
      </li>
      <li>
        <code className="rounded bg-[var(--card-elevated)] px-1 py-0.5 text-[12px] ring-1 ring-[var(--border)]">
          [YOUR-PASSWORD]
        </code>{" "}
        は実パスワードに置換（{" "}
        <strong className="text-foreground">[] は付けない</strong>）
      </li>
      <li>
        <code className="rounded bg-[var(--card-elevated)] px-1 py-0.5 text-[12px] ring-1 ring-[var(--border)]">
          DATABASE_URL
        </code>{" "}
        /{" "}
        <code className="rounded bg-[var(--card-elevated)] px-1 py-0.5 text-[12px] ring-1 ring-[var(--border)]">
          DIRECT_URL
        </code>{" "}
        を Production に入れて<strong className="text-foreground">再デプロイ</strong>
      </li>
    </ul>
  );
}
