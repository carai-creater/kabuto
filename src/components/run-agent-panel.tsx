"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";

import { getSessionWalletBalance } from "@/app/actions/wallet";

const LLMS = [
  { id: "gpt-4o", label: "GPT-4o" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
] as const;

function coerceModelId(id: string | undefined): string {
  if (!id) return LLMS[0].id;
  return LLMS.some((m) => m.id === id) ? id : LLMS[0].id;
}

function uiMessagePlainText(m: UIMessage): string {
  if (!m.parts?.length) return "";
  const lines: string[] = [];
  for (const p of m.parts) {
    if (p.type === "text") {
      lines.push(p.text);
    } else if (p.type === "reasoning") {
      lines.push(`[思考] ${p.text}`);
    } else if (p.type === "step-start") {
      continue;
    } else if (p.type === "dynamic-tool") {
      lines.push(`[ツール ${p.toolName}]`);
    } else if (typeof p.type === "string" && p.type.startsWith("tool-")) {
      lines.push(`[ツール ${p.type.slice("tool-".length)}]`);
    }
  }
  return lines.join("\n");
}

type ToolRow = { name: string; type?: string };

type Props = {
  agentId: string;
  /** DB の defaultLlm など。未指定時は LLMS[0] */
  defaultModelId?: string;
  pricePerUsePt: number;
  starters: { id: string; position: number; text: string }[];
  tools: unknown;
  /** 作成者のみ true。false のときツール名は表示しない */
  showToolDetails?: boolean;
  fullScreenChat?: boolean;
};

export function RunAgentPanel({
  agentId,
  defaultModelId,
  pricePerUsePt,
  starters,
  tools,
  showToolDetails = false,
  fullScreenChat = false,
}: Props) {
  const panelId = useId();
  const router = useRouter();
  const [llm, setLlm] = useState(() => coerceModelId(defaultModelId));
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        fetch: async (url, init) => {
          const res = await fetch(
            typeof url === "string" ? url : url.toString(),
            init
          );
          if (res.status === 401) {
            throw new Error("KABUTO_UNAUTHORIZED");
          }
          if (res.status === 402) {
            const text = await res.text();
            throw new Error(`KABUTO_INSUFFICIENT:${text}`);
          }
          if (!res.ok) {
            const text = await res.text();
            throw new Error(text || `HTTP ${res.status}`);
          }
          return res;
        },
        prepareSendMessagesRequest: ({ messages, body }) => ({
          body: {
            ...body,
            messages,
            modelId: llm,
            agentId,
            idempotencyKey: crypto.randomUUID(),
          },
        }),
      }),
    [llm, agentId]
  );

  const { messages, sendMessage, status, clearError } = useChat({
    id: agentId,
    transport,
    onFinish: async () => {
      const b = await getSessionWalletBalance();
      setBalance(b);
      router.refresh();
    },
    onError: (err) => {
      if (err.message === "KABUTO_UNAUTHORIZED") {
        setError("デモでユーザーを選んでから実行してください（/demo）。");
        return;
      }
      if (err.message.startsWith("KABUTO_INSUFFICIENT:")) {
        const raw = err.message.slice("KABUTO_INSUFFICIENT:".length);
        try {
          const j = JSON.parse(raw) as {
            requiredPt?: number;
            balancePt?: number;
          };
          setError(
            `ポイントが足りません（推定 ${j.requiredPt ?? "?"} pt、残高 ${j.balancePt ?? "?"} pt）。`
          );
        } catch {
          setError("ポイントが足りません。");
        }
        return;
      }
      setError(err.message || "エラーが発生しました。");
    },
  });

  const pending = status === "submitted" || status === "streaming";

  useEffect(() => {
    const run = async () => {
      const b = await getSessionWalletBalance();
      setBalance(b);
    };
    void run();
  }, []);

  const toolRows = useMemo(() => {
    if (!Array.isArray(tools)) return [] as ToolRow[];
    return tools.filter((t): t is ToolRow => t != null && typeof t === "object");
  }, [tools]);

  const run = useCallback(async () => {
    setError(null);
    clearError();
    const text = message.trim();
    if (!text) {
      setError("メッセージを入力するか、スターターを選んでください。");
      return;
    }
    setMessage("");
    await sendMessage({ text });
  }, [message, sendMessage, clearError]);

  return (
    <section
      className={
        fullScreenChat
          ? "mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-3 sm:px-6"
          : "surface-card p-6 sm:p-8"
      }
      aria-labelledby={fullScreenChat ? undefined : `${panelId}-heading`}
      aria-label={fullScreenChat ? "チャット" : undefined}
    >
      {!fullScreenChat ? (
        <h2
          id={`${panelId}-heading`}
          className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]"
        >
          チャット
        </h2>
      ) : (
        <div className="mb-3 flex items-center justify-between gap-4 border-b border-[var(--border)] pb-3">
          <p className="text-[14px] font-semibold text-foreground">チャット</p>
          <div className="w-[12rem]">
            <select
              id={`${panelId}-llm`}
              value={llm}
              onChange={(e) => setLlm(e.target.value)}
              disabled={pending}
              className="input-apple h-10 w-full py-1 text-[13px]"
            >
              {LLMS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {showToolDetails && toolRows.length > 0 && !fullScreenChat && (
        <div className="mt-5">
          <p className="text-label">接続ツール</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {toolRows.map((t) => (
              <li
                key={t.name}
                className="rounded-full bg-[var(--card-elevated)] px-3 py-1 text-[12px] text-[var(--subtle)] ring-1 ring-[var(--border)]"
              >
                {t.name}
                {t.type ? (
                  <span className="text-[var(--muted)]"> · {t.type}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!fullScreenChat && (
        <div className="mt-6 grid gap-4 sm:grid-cols-[1fr,11rem] sm:items-end">
          <div>
            <label htmlFor={`${panelId}-llm`} className="text-label">
              モデル
            </label>
            <select
              id={`${panelId}-llm`}
              value={llm}
              onChange={(e) => setLlm(e.target.value)}
              disabled={pending}
              className="input-apple mt-2 w-full"
            >
              {LLMS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="text-right text-[13px] text-[var(--muted)] sm:pb-2">
            掲載{" "}
            <span className="font-semibold tabular-nums text-[var(--brand)]">
              {pricePerUsePt} pt/回
            </span>
            <span className="block text-[11px] text-[var(--muted)]">
              実際はトークン従量
            </span>
          </div>
        </div>
      )}

      {fullScreenChat ? (
        <>
          <div className="flex-1 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card-elevated)]/40 p-4 sm:p-5">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-[14px] text-[var(--muted)]">
                メッセージを入力して開始
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={
                      m.role === "user"
                        ? "ml-auto max-w-[92%] rounded-2xl bg-[var(--card)] px-4 py-3 text-[15px] leading-relaxed text-[var(--foreground)] ring-1 ring-[var(--border)]"
                        : "mr-auto max-w-[92%] rounded-2xl bg-[var(--brand-muted)] px-4 py-3 text-[15px] leading-relaxed text-[var(--foreground)]"
                    }
                  >
                    {m.role === "assistant" ? (
                      <pre className="whitespace-pre-wrap">
                        {uiMessagePlainText(m)}
                      </pre>
                    ) : (
                      uiMessagePlainText(m)
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          {error && (
            <p
              className="mt-3 text-[14px] text-[var(--destructive)]"
              role="alert"
            >
              {error}
            </p>
          )}
          <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3">
            {starters.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {starters
                  .sort((a, b) => a.position - b.position)
                  .map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      disabled={pending}
                      onClick={() => setMessage(s.text)}
                      className="max-w-full rounded-full border border-[var(--border)] bg-[var(--card-elevated)] px-3 py-1.5 text-left text-[12px] leading-snug text-[var(--foreground)] transition hover:border-[var(--accent)] disabled:opacity-50"
                    >
                      {s.text}
                    </button>
                  ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                id={`${panelId}-msg`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                placeholder="メッセージを入力..."
                className="input-apple min-h-[44px] w-full resize-y border-none bg-transparent px-3 py-2 shadow-none ring-0"
              />
              <button
                type="button"
                disabled={pending}
                onClick={() => void run()}
                className="btn-primary h-10 shrink-0 px-4 py-0 text-[14px]"
              >
                {pending ? "送信中…" : "送信"}
              </button>
            </div>
            <div className="mt-2 text-right text-[12px] text-[var(--muted)]">
              掲載{" "}
              <span className="font-semibold tabular-nums text-[var(--brand)]">
                {pricePerUsePt} pt/回
              </span>
              {balance != null && (
                <>
                  {" "}
                  · 残高{" "}
                  <span className="font-medium tabular-nums text-foreground">
                    {balance} pt
                  </span>
                </>
              )}
              <span className="block text-[11px] text-[var(--muted)]">
                消費はトークンに応じて変動（完了時に確定）
              </span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="mt-5">
            <label htmlFor={`${panelId}-msg`} className="text-label">
              メッセージ
            </label>
            <textarea
              id={`${panelId}-msg`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="質問を入力…"
              className="input-apple mt-2 w-full resize-y placeholder:text-[var(--muted)]"
            />
          </div>
          {starters.length > 0 && (
            <div className="mt-5">
              <p className="text-label">会話スターター</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {starters
                  .sort((a, b) => a.position - b.position)
                  .map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      disabled={pending}
                      onClick={() => setMessage(s.text)}
                      className="max-w-full rounded-full border border-[var(--border)] bg-[var(--card-elevated)] px-4 py-2 text-left text-[13px] leading-snug text-[var(--foreground)] transition hover:border-[var(--accent)] disabled:opacity-50"
                    >
                      {s.text}
                    </button>
                  ))}
              </div>
            </div>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              type="button"
              disabled={pending}
              onClick={() => void run()}
              className="btn-primary min-w-[120px]"
            >
              {pending ? "送信中…" : "送信"}
            </button>
            {balance != null && (
              <span className="text-[13px] text-[var(--muted)]">
                残高{" "}
                <span className="font-medium tabular-nums text-foreground">
                  {balance} pt
                </span>
              </span>
            )}
          </div>
          {error && (
            <p
              className="mt-4 text-[15px] text-[var(--destructive)]"
              role="alert"
            >
              {error}
            </p>
          )}
          {messages.length > 0 && (
            <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card-elevated)] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                会話ログ
              </p>
              <div className="mt-2 space-y-3">
                {messages.map((m) => (
                  <div key={m.id}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                      {m.role === "user" ? "ユーザー" : "応答"}
                    </p>
                    <pre className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--foreground)]">
                      {uiMessagePlainText(m)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
