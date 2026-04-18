"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { saveMcpConnection, deleteMcpConnection } from "@/app/actions/mcp-connections";
import type { McpConnectionRow } from "@/app/actions/mcp-connections";

type AuthType = "token" | "oauth";

type ServiceDef = {
  key: string;
  label: string;
  icon: string;
  hint: string;
  authType: AuthType;
};

const MCP_SERVICES: ServiceDef[] = [
  { key: "github",         label: "GitHub",         icon: "🐙", hint: "Personal Access Token (repo, read:org)", authType: "token" },
  { key: "notion",         label: "Notion",          icon: "📝", hint: "Internal Integration Token",            authType: "token" },
  { key: "slack",          label: "Slack",           icon: "💬", hint: "Bot User OAuth Token (xoxb-...)",       authType: "token" },
  { key: "google-drive",   label: "Google Drive",    icon: "📁", hint: "Google アカウントでログインして同意",    authType: "oauth" },
  { key: "google-calendar",label: "Google Calendar", icon: "📅", hint: "Google アカウントでログインして同意",    authType: "oauth" },
  { key: "gmail",          label: "Gmail",           icon: "✉️", hint: "Google アカウントでログインして同意",    authType: "oauth" },
  { key: "linear",         label: "Linear",          icon: "⬡",  hint: "Personal API Key",                      authType: "token" },
  { key: "jira",           label: "Jira",            icon: "🟦", hint: "API Token (Atlassian)",                 authType: "token" },
  { key: "supabase",       label: "Supabase",        icon: "⚡", hint: "Service Role Key",                      authType: "token" },
  { key: "stripe",         label: "Stripe",          icon: "💳", hint: "Restricted API Key (read-only)",        authType: "token" },
  { key: "hubspot",        label: "HubSpot",         icon: "🧲", hint: "Private App Token",                     authType: "token" },
  { key: "airtable",       label: "Airtable",        icon: "🗂",  hint: "Personal Access Token",                 authType: "token" },
  { key: "brave-search",   label: "Brave Search",    icon: "🦁", hint: "Brave Search API Key",                  authType: "token" },
  { key: "figma",          label: "Figma",           icon: "🎨", hint: "Personal Access Token",                 authType: "token" },
];

type Props = {
  initialConnections: McpConnectionRow[];
};

export function McpConnectionsPanel({ initialConnections }: Props) {
  const [connections, setConnections] = useState<McpConnectionRow[]>(initialConnections);
  const [adding, setAdding] = useState<string | null>(null);
  const [credential, setCredential] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // OAuth 戻り後のバナー表示
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? "/dashboard/settings";
  const [banner, setBanner] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const ok = searchParams?.get("mcp_connected");
    const err = searchParams?.get("mcp_error");
    if (ok === "google") {
      setBanner({ kind: "success", text: "Google アカウントを接続しました。" });
    } else if (err) {
      setBanner({ kind: "error", text: `接続に失敗しました (${err})` });
    }
  }, [searchParams]);

  function findConnection(key: string): McpConnectionRow | undefined {
    return connections.find((c) => c.serverKey === key);
  }

  function handleAdd(serviceKey: string) {
    setAdding(serviceKey);
    setCredential("");
    setError(null);
  }

  function handleSave(service: ServiceDef) {
    if (!credential.trim()) {
      setError("トークンを入力してください");
      return;
    }
    setError(null);
    startTransition(async () => {
      await saveMcpConnection(service.key, service.label, credential.trim());
      setConnections((prev) => {
        const next = prev.filter((c) => c.serverKey !== service.key);
        next.unshift({
          serverKey: service.key,
          label: service.label,
          connectedAt: new Date(),
          authType: "token",
          accountEmail: null,
        });
        return next;
      });
      setAdding(null);
      setCredential("");
    });
  }

  function handleDelete(key: string) {
    startTransition(async () => {
      await deleteMcpConnection(key);
      setConnections((prev) => prev.filter((c) => c.serverKey !== key));
    });
  }

  function oauthStartHref(): string {
    const returnTo = encodeURIComponent(pathname);
    return `/api/mcp/oauth/google/start?returnTo=${returnTo}`;
  }

  return (
    <div className="space-y-4">
      {banner && (
        <div
          className={`rounded-2xl border px-4 py-3 text-[13px] ${
            banner.kind === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
              : "border-red-500/40 bg-red-500/10 text-red-800 dark:text-red-100"
          }`}
        >
          {banner.text}
        </div>
      )}
      {MCP_SERVICES.map((service) => {
        const conn = findConnection(service.key);
        const connected = Boolean(conn);
        const isAdding = adding === service.key;

        return (
          <div
            key={service.key}
            className={`rounded-2xl border p-4 transition ${
              connected
                ? "border-[var(--accent)]/30 bg-[var(--brand-muted)]"
                : "border-[var(--border)] bg-[var(--card)]"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{service.icon}</span>
                <div>
                  <p className="text-[14px] font-semibold text-[var(--foreground)]">{service.label}</p>
                  {connected ? (
                    <p className="text-[12px] text-[var(--accent)]">
                      ✓ 接続済み
                      {conn?.authType === "oauth" && conn.accountEmail ? ` (${conn.accountEmail})` : ""}
                    </p>
                  ) : (
                    <p className="text-[12px] text-[var(--muted)]">未接続</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {connected ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => handleDelete(service.key)}
                    className="rounded-full border border-[var(--border)] px-3 py-1 text-[12px] font-medium text-[var(--muted)] transition hover:border-red-400/50 hover:text-red-500 disabled:opacity-50"
                  >
                    解除
                  </button>
                ) : service.authType === "oauth" ? (
                  <a
                    href={oauthStartHref()}
                    className="rounded-full bg-[var(--accent)] px-4 py-1.5 text-[12px] font-semibold text-white transition hover:bg-[var(--accent-hover)]"
                  >
                    Google でログイン
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => (isAdding ? setAdding(null) : handleAdd(service.key))}
                    className="rounded-full bg-[var(--accent)] px-4 py-1.5 text-[12px] font-semibold text-white transition hover:bg-[var(--accent-hover)]"
                  >
                    {isAdding ? "キャンセル" : "接続する"}
                  </button>
                )}
              </div>
            </div>

            {isAdding && service.authType === "token" && (
              <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-4">
                <p className="text-[12px] text-[var(--muted)]">💡 {service.hint}</p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={credential}
                    onChange={(e) => setCredential(e.target.value)}
                    placeholder="トークンを貼り付け…"
                    className="input-apple flex-1 text-[13px]"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave(service);
                      if (e.key === "Escape") setAdding(null);
                    }}
                  />
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => handleSave(service)}
                    className="rounded-xl bg-[var(--accent)] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
                  >
                    保存
                  </button>
                </div>
                {error && <p className="text-[12px] text-red-500">{error}</p>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
