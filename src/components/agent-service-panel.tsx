"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  KeyRound,
  Loader2,
  X,
} from "lucide-react";
import { saveMcpConnection, deleteMcpConnection } from "@/app/actions/mcp-connections";

type AuthType = "token" | "oauth";

/** クリエイターが宣言できるサービス一覧（ユーザー向け表示用） */
const SERVICE_META: Record<string, { label: string; icon: string; hint: string; description: string; authType: AuthType }> = {
  "github":          { label: "GitHub",          icon: "🐙", hint: "Personal Access Token (repo, read:org)",     description: "コードや Issue の読み書き", authType: "token" },
  "notion":          { label: "Notion",          icon: "📝", hint: "Internal Integration Token",                 description: "ドキュメントの読み書き",   authType: "token" },
  "slack":           { label: "Slack",           icon: "💬", hint: "Bot User OAuth Token (xoxb-...)",            description: "チャンネルへの送受信",     authType: "token" },
  "google-drive":    { label: "Google Drive",    icon: "📁", hint: "Google アカウントでログインして同意",         description: "ファイルの検索・読み書き", authType: "oauth" },
  "google-calendar": { label: "Google Calendar", icon: "📅", hint: "Google アカウントでログインして同意",         description: "予定の確認・作成",         authType: "oauth" },
  "gmail":           { label: "Gmail",           icon: "✉️", hint: "Google アカウントでログインして同意",         description: "メールの検索・送信",       authType: "oauth" },
  "linear":          { label: "Linear",          icon: "⬡",  hint: "Personal API Key",                           description: "Issue の管理",             authType: "token" },
  "jira":            { label: "Jira",            icon: "🟦", hint: "API Token (Atlassian)",                      description: "チケットの管理",           authType: "token" },
  "supabase":        { label: "Supabase",        icon: "⚡", hint: "Service Role Key",                           description: "データベース操作",         authType: "token" },
  "stripe":          { label: "Stripe",          icon: "💳", hint: "Restricted API Key (read-only)",             description: "決済・顧客情報の確認",     authType: "token" },
  "hubspot":         { label: "HubSpot",         icon: "🧲", hint: "Private App Token",                          description: "CRM・コンタクト管理",      authType: "token" },
  "airtable":        { label: "Airtable",        icon: "🗂",  hint: "Personal Access Token",                     description: "レコードの読み書き",       authType: "token" },
  "brave-search":    { label: "Brave Search",    icon: "🦁", hint: "Brave Search API Key",                       description: "ウェブ検索",               authType: "token" },
  "figma":           { label: "Figma",           icon: "🎨", hint: "Personal Access Token",                      description: "デザインファイルの参照",   authType: "token" },
  "zapier":          { label: "Zapier",          icon: "⚡", hint: "Zapier API Key",                             description: "自動化ワークフロー",       authType: "token" },
};

type ConnectedService = {
  serverKey: string;
  authType?: AuthType;
  accountEmail?: string | null;
};
type Service = {
  key: string;
  label: string;
  icon: string;
  hint: string;
  description: string;
  authType: AuthType;
};

type Props = {
  /** クリエイターが宣言したサービスキー一覧 */
  requiredServices: string[];
  /** ユーザーが接続済みのサービス一覧 */
  connectedServices: ConnectedService[];
  /** ログイン済みかどうか */
  isLoggedIn: boolean;
};

export function AgentServicePanel({ requiredServices, connectedServices, isLoggedIn }: Props) {
  const [connectionMap, setConnectionMap] = useState<Map<string, ConnectedService>>(
    () => new Map(connectedServices.map((c) => [c.serverKey, c] as const)),
  );
  const [connectingService, setConnectingService] = useState<Service | null>(null);
  const [pending, startTransition] = useTransition();

  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const [banner, setBanner] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  useEffect(() => {
    const ok = searchParams?.get("mcp_connected");
    const err = searchParams?.get("mcp_error");
    if (ok === "google") setBanner({ kind: "success", text: "Google アカウントを接続しました。" });
    else if (err) setBanner({ kind: "error", text: `接続に失敗しました (${err})` });
  }, [searchParams]);

  const services: Service[] = requiredServices.map((key) => ({
    key,
    ...(SERVICE_META[key] ?? {
      label: key,
      icon: "🔌",
      hint: "API キー",
      description: "外部サービス",
      authType: "token" as AuthType,
    }),
  }));

  const connectedCount = services.filter((s) => connectionMap.has(s.key)).length;
  const allConnected = connectedCount === services.length;
  const missingCount = services.length - connectedCount;

  // 全接続済みの初回レンダーは畳む。未接続があるときは必ず開く。
  const [expanded, setExpanded] = useState(!allConnected);

  if (requiredServices.length === 0) return null;

  function handleSaveCredential(service: Service, credential: string) {
    startTransition(async () => {
      await saveMcpConnection(service.key, service.label, credential);
      setConnectionMap((prev) => {
        const next = new Map(prev);
        next.set(service.key, { serverKey: service.key, authType: "token" });
        return next;
      });
      setConnectingService(null);
    });
  }

  function handleDisconnect(key: string) {
    startTransition(async () => {
      await deleteMcpConnection(key);
      setConnectionMap((prev) => {
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
    });
  }

  // コンパクトなヘッダーバー — 常時表示
  const headerTone = allConnected
    ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20"
    : "border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/25";

  const headerText = allConnected
    ? `連携サービス ${connectedCount}/${services.length} 接続済み`
    : `連携サービス ${connectedCount}/${services.length} — 未接続 ${missingCount} 件`;

  const headerIcon = allConnected ? (
    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
  ) : (
    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" aria-hidden />
  );

  return (
    <>
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
      <section className={`rounded-2xl border ${headerTone}`}>
        {/* Header bar — one line, always visible */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5"
          aria-expanded={expanded}
        >
          <div className="flex min-w-0 items-center gap-2">
            {headerIcon}
            <span
              className={`text-[13px] font-semibold ${
                allConnected
                  ? "text-emerald-900 dark:text-emerald-100"
                  : "text-amber-900 dark:text-amber-100"
              }`}
            >
              {headerText}
            </span>
            <div className="hidden items-center gap-1 sm:flex" aria-hidden>
              {services.map((s) => (
                <span
                  key={s.key}
                  className={`text-[14px] ${
                    connectionMap.has(s.key) ? "opacity-100" : "opacity-35 grayscale"
                  }`}
                  title={s.label}
                >
                  {s.icon}
                </span>
              ))}
            </div>
          </div>
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform ${
              expanded ? "rotate-180" : ""
            } ${
              allConnected
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-amber-700 dark:text-amber-300"
            }`}
            aria-hidden
          />
        </button>

        {/* Expanded grid */}
        {expanded && (
          <div className="border-t border-[var(--border)]/40 px-3.5 pb-3.5 pt-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {services.map((service) => {
                const conn = connectionMap.get(service.key);
                return (
                  <ConnectorCard
                    key={service.key}
                    service={service}
                    connected={connectionMap.has(service.key)}
                    accountEmail={conn?.accountEmail ?? null}
                    isLoggedIn={isLoggedIn}
                    pending={pending}
                    pathname={pathname}
                    onConnect={() => setConnectingService(service)}
                    onDisconnect={() => handleDisconnect(service.key)}
                  />
                );
              })}
            </div>

            <p className="mt-3 flex flex-wrap items-center gap-x-1 text-[11px] text-[var(--muted)]">
              <KeyRound className="h-3 w-3" aria-hidden />
              トークンは暗号化して保存されます。
              <Link
                href="/dashboard/settings"
                target="_blank"
                className="text-[var(--accent)] underline"
              >
                設定画面
              </Link>
              でも管理できます。
            </p>
          </div>
        )}
      </section>

      {/* Focused credential dialog — one service at a time */}
      {connectingService && (
        <ConnectCredentialDialog
          service={connectingService}
          pending={pending}
          onSave={(cred) => handleSaveCredential(connectingService, cred)}
          onClose={() => setConnectingService(null)}
        />
      )}
    </>
  );
}

// ---------- Connector card ----------

function ConnectorCard({
  service,
  connected,
  accountEmail,
  isLoggedIn,
  pending,
  pathname,
  onConnect,
  onDisconnect,
}: {
  service: Service;
  connected: boolean;
  accountEmail: string | null;
  isLoggedIn: boolean;
  pending: boolean;
  pathname: string;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const oauthHref = `/api/mcp/oauth/google/start?returnTo=${encodeURIComponent(pathname)}`;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
        connected
          ? "border-[var(--border)] bg-[var(--card)]"
          : "border-amber-500/30 bg-[var(--card-elevated)]"
      }`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--card-elevated)] text-[18px]">
        {service.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[13px] font-semibold text-[var(--foreground)]">
            {service.label}
          </p>
          <StatusDot connected={connected} />
        </div>
        <p className="truncate text-[11px] text-[var(--muted)]">
          {connected
            ? accountEmail
              ? `接続済み (${accountEmail})`
              : "接続済み"
            : service.description}
        </p>
      </div>

      {!isLoggedIn ? (
        <Link
          href="/login"
          className="shrink-0 rounded-full bg-[var(--accent)] px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-[var(--accent-hover)]"
        >
          ログイン
        </Link>
      ) : connected ? (
        <button
          type="button"
          disabled={pending}
          onClick={onDisconnect}
          className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium text-[var(--muted)] transition hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
        >
          解除
        </button>
      ) : service.authType === "oauth" ? (
        <a
          href={oauthHref}
          className="shrink-0 rounded-full bg-[var(--accent)] px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-[var(--accent-hover)]"
        >
          Google でログイン
        </a>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={onConnect}
          className="shrink-0 rounded-full bg-[var(--accent)] px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          接続
        </button>
      )}
    </div>
  );
}

function StatusDot({ connected }: { connected: boolean }) {
  return (
    <span
      className={`inline-block h-1.5 w-1.5 rounded-full ${
        connected ? "bg-emerald-500" : "bg-amber-500"
      }`}
      aria-hidden
    />
  );
}

// ---------- Credential entry dialog ----------

function ConnectCredentialDialog({
  service,
  pending,
  onSave,
  onClose,
}: {
  service: Service;
  pending: boolean;
  onSave: (credential: string) => void;
  onClose: () => void;
}) {
  const [credential, setCredential] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleSubmit() {
    const trimmed = credential.trim();
    if (!trimmed) {
      setError("トークンを入力してください");
      return;
    }
    setError(null);
    onSave(trimmed);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mcp-connect-title"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--card-elevated)] text-[22px]">
            {service.icon}
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="mcp-connect-title"
              className="text-[15px] font-semibold text-[var(--foreground)]"
            >
              {service.label} に接続
            </h2>
            <p className="mt-0.5 text-[12px] text-[var(--muted)]">
              {service.description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1 text-[var(--muted)] transition hover:bg-[var(--card-elevated)] hover:text-[var(--foreground)]"
            aria-label="閉じる"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-3 rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] p-3">
          <p className="flex items-start gap-1.5 text-[11px] text-[var(--muted)]">
            <KeyRound className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
            <span>{service.hint}</span>
          </p>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-[12px] font-medium text-[var(--muted)]">
            トークン
          </span>
          <input
            ref={inputRef}
            type="password"
            value={credential}
            onChange={(e) => setCredential(e.target.value)}
            placeholder="トークンを貼り付け…"
            className="input-apple w-full text-[13px]"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
          />
        </label>

        {error && (
          <p className="mt-2 text-[11px] text-red-500" role="alert">
            {error}
          </p>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-1.5 text-[12px] font-medium text-[var(--muted)] transition hover:bg-[var(--card-elevated)]"
          >
            キャンセル
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={handleSubmit}
            className="flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 py-1.5 text-[12px] font-semibold text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {pending && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
            接続する
          </button>
        </div>

        <p className="mt-4 text-[11px] text-[var(--muted)]">
          トークンは暗号化して保存され、このエージェントのみが使用します。
        </p>
      </div>
    </div>
  );
}
