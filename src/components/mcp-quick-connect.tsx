"use client";

/**
 * クリエイター向け: このエージェントが「どの外部サービスを使うか」を宣言するだけ。
 * 実際のトークン/認証はユーザーが設定画面（/dashboard/settings）で接続する。
 */

const MCP_SERVICES = [
  { key: "github",          label: "GitHub",          icon: "🐙", description: "リポジトリ・Issue・PR の操作" },
  { key: "notion",          label: "Notion",          icon: "📝", description: "ドキュメント読み書き" },
  { key: "slack",           label: "Slack",           icon: "💬", description: "チャンネル読み書き・通知" },
  { key: "google-drive",    label: "Google Drive",    icon: "📁", description: "ファイル検索・読み書き" },
  { key: "google-calendar", label: "Google Calendar", icon: "📅", description: "予定確認・作成" },
  { key: "gmail",           label: "Gmail",           icon: "✉️", description: "メール検索・送信" },
  { key: "linear",          label: "Linear",          icon: "⬡",  description: "Issue 管理" },
  { key: "jira",            label: "Jira",            icon: "🟦", description: "チケット管理" },
  { key: "supabase",        label: "Supabase",        icon: "⚡", description: "データベース操作" },
  { key: "stripe",          label: "Stripe",          icon: "💳", description: "決済・顧客情報" },
  { key: "hubspot",         label: "HubSpot",         icon: "🧲", description: "CRM・コンタクト" },
  { key: "airtable",        label: "Airtable",        icon: "🗂",  description: "レコード読み書き" },
  { key: "brave-search",    label: "Brave Search",    icon: "🦁", description: "ウェブ検索" },
  { key: "figma",           label: "Figma",           icon: "🎨", description: "デザインファイル参照" },
  { key: "zapier",          label: "Zapier",          icon: "⚡", description: "自動化ワークフロー" },
];

type Props = {
  initial?: {
    enabled?: boolean;
    serverKey?: string;
    endpointUrl?: string;
    instruction?: string;
  };
};

export function McpQuickConnect({ initial }: Props) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          必要な外部サービス連携
        </h2>
        <p className="mt-2 text-[13px] text-[var(--muted)]">
          このエージェントが使う外部サービスを選択します。
          利用者はサービスを使う際に自分のトークンを
          <a href="/dashboard/settings" target="_blank" className="mx-1 text-[var(--accent)] underline">
            設定画面
          </a>
          で接続します。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {MCP_SERVICES.map((service) => (
          <label
            key={service.key}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 transition hover:border-[var(--accent)]/40 has-[:checked]:border-[var(--accent)]/40 has-[:checked]:bg-[var(--brand-muted)]"
          >
            <input
              type="checkbox"
              name="mcp_service"
              value={service.key}
              defaultChecked={initial?.serverKey === service.key && initial?.enabled}
              className="h-4 w-4 rounded accent-[var(--accent)]"
            />
            <span className="text-xl">{service.icon}</span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-[var(--foreground)]">{service.label}</p>
              <p className="text-[11px] text-[var(--muted)]">{service.description}</p>
            </div>
          </label>
        ))}
      </div>

      {/* 既存フォームとの後方互換（隠しフィールド） */}
      <input type="hidden" name="mcpEnabled" value="false" />
      <input type="hidden" name="mcpServerKey" defaultValue={initial?.serverKey ?? ""} />
      <input type="hidden" name="mcpEndpointUrl" defaultValue={initial?.endpointUrl ?? ""} />
      <input type="hidden" name="mcpInstruction" defaultValue={initial?.instruction ?? ""} />
    </section>
  );
}
