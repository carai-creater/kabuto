/** Vercel × Supabase × Prisma でよくある接続ミス向けのヒント */
export function DbConnectionTips() {
  return (
    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-left text-[13px] leading-relaxed text-[var(--muted)]">
      <li>
        URL は{" "}
        <code className="rounded bg-[var(--card-elevated)] px-1 py-0.5 text-[12px] ring-1 ring-[var(--border)]">
          postgresql://
        </code>{" "}
        で始まるもの（
        <code className="rounded bg-[var(--card-elevated)] px-1 py-0.5 text-[12px] ring-1 ring-[var(--border)]">
          https://
        </code>{" "}
        のプロジェクト URL は使えません）
      </li>
      <li>
        パスワード部分の{" "}
        <code className="rounded bg-[var(--card-elevated)] px-1 py-0.5 text-[12px] ring-1 ring-[var(--border)]">
          [YOUR-PASSWORD]
        </code>{" "}
        は<strong className="text-foreground">実パスワードに置き換え、角括弧 [] は付けない</strong>
        でください（そのまま貼ると認証エラーになります）
      </li>
      <li>
        <code className="rounded bg-[var(--card-elevated)] px-1 py-0.5 text-[12px] ring-1 ring-[var(--border)]">
          DATABASE_URL
        </code>{" "}
        と{" "}
        <code className="rounded bg-[var(--card-elevated)] px-1 py-0.5 text-[12px] ring-1 ring-[var(--border)]">
          DIRECT_URL
        </code>{" "}
        を <strong className="text-foreground">Production</strong> に設定し、保存後{" "}
        <strong className="text-foreground">再デプロイ</strong>してください
      </li>
    </ul>
  );
}
