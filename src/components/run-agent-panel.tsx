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
import { saveChatMessages } from "@/app/actions/chat-history";
import { GuestLimitModal } from "@/components/guest-limit-modal";
import {
  AGENT_MODEL_OPTIONS,
  coerceAgentModelId,
} from "@/lib/agent/model-options";

function coerceModelId(id: string | undefined): string {
  return coerceAgentModelId(id);
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
      lines.push(`[処理中: ${p.toolName}]`);
    } else if (typeof p.type === "string" && p.type.startsWith("tool-")) {
      lines.push(`[処理中]`);
    }
  }
  return lines.join("\n");
}

type ToolRow = { name: string; type?: string };

type Props = {
  agentId: string;
  /** ログイン済みなら true（ウォレット更新・課金あり） */
  isLoggedIn?: boolean;
  /** DB の defaultLlm など。未指定時は先頭モデル */
  defaultModelId?: string;
  /**
   * false のとき GPT エディタの「推奨モデルを使用しない」相当。
   * プレビューでは先頭モデルから試し、利用者は常にモデルを選べる。
   */
  useCreatorRecommendedModel?: boolean;
  pricePerUsePt: number;
  starters: { id: string; position: number; text: string }[];
  tools: unknown;
  /** 作成者のみ true。false のときツール名は表示しない */
  showToolDetails?: boolean;
  fullScreenChat?: boolean;
  /** チャット履歴（初期メッセージ） */
  initialMessages?: { role: "user" | "assistant"; content: string }[];
  /** 履歴保存用セッションID */
  chatSessionId?: string;
};

export function RunAgentPanel({
  agentId,
  isLoggedIn = false,
  defaultModelId,
  useCreatorRecommendedModel = true,
  pricePerUsePt,
  starters,
  tools,
  showToolDetails = false,
  fullScreenChat = false,
  initialMessages,
  chatSessionId,
}: Props) {
  const panelId = useId();
  const router = useRouter();
  const [llm, setLlm] = useState(() =>
    useCreatorRecommendedModel
      ? coerceModelId(defaultModelId)
      : coerceModelId(undefined),
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [guestLimitOpen, setGuestLimitOpen] = useState(false);
  const [showModelSelect, setShowModelSelect] = useState(false);

  // initialMessages を ai SDK の形式に変換
  const initialAiMessages = useMemo(() => {
    if (!initialMessages?.length) return undefined;
    return initialMessages.map((m, i) => ({
      id: `hist-${i}`,
      role: m.role,
      content: m.content,
      parts: [{ type: "text" as const, text: m.content }],
    }));
  }, [initialMessages]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        fetch: async (url, init) => {
          const res = await fetch(
            typeof url === "string" ? url : url.toString(),
            init
          );
          if (res.status === 429) {
            const text = await res.text();
            let code: string | undefined;
            try {
              code = (JSON.parse(text) as { code?: string }).code;
            } catch {
              code = undefined;
            }
            if (code === "GUEST_LIMIT") {
              throw new Error("KABUTO_GUEST_LIMIT");
            }
            throw new Error(text || "Too many requests");
          }
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
    id: `${agentId}-${isLoggedIn ? "auth" : "guest"}`,
    transport,
    messages: initialAiMessages,
    onFinish: async ({ finishReason }) => {
      if (!isLoggedIn) return;
      const b = await getSessionWalletBalance();
      setBalance(b);
      router.refresh();
      // チャット履歴を保存
      if (finishReason === "stop" || finishReason === "length") {
        await saveChatMessages(agentId, chatSessionId ?? null, messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: uiMessagePlainText(m),
        })));
      }
    },
    onError: (err) => {
      if (err.message === "KABUTO_GUEST_LIMIT") {
        setGuestLimitOpen(true);
        return;
      }
      if (err.message === "KABUTO_UNAUTHORIZED") {
        setError("ログインが必要です（/login）。");
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
    if (!isLoggedIn) return;
    const run = async () => {
      const b = await getSessionWalletBalance();
      setBalance(b);
    };
    void run();
  }, [isLoggedIn]);

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
    <>
      <GuestLimitModal
        open={guestLimitOpen}
        onClose={() => setGuestLimitOpen(false)}
      />
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
          試してみる
        </h2>
      ) : (
        <div className="mb-3 flex items-center justify-between gap-4 border-b border-[var(--border)] pb-3">
          <p className="text-[14px] font-semibold text-foreground">メッセージ</p>
          {/* モデル選択は詳細オプションとして折りたたむ */}
          <button
            type="button"
            onClick={() => setShowModelSelect((v) => !v)}
            className="text-[12px] text-[var(--muted)] transition hover:text-[var(--foreground)]"
          >
            {showModelSelect ? "▲ オプションを隠す" : "▼ 詳細オプション"}
          </button>
        </div>
      )}

      {fullScreenChat && showModelSelect && (
        <div className="mb-3 rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] px-4 py-3">
          <label htmlFor={`${panelId}-llm`} className="text-label block mb-1.5">
            モデル
          </label>
          <select
            id={`${panelId}-llm`}
            value={llm}
            onChange={(e) => setLlm(e.target.value)}
            disabled={pending}
            className="input-apple h-10 w-full max-w-[14rem] py-1 text-[13px]"
          >
            {AGENT_MODEL_OPTIONS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
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
              {AGENT_MODEL_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="text-right text-[13px] text-[var(--muted)] sm:pb-2">
            <span className="font-semibold tabular-nums text-[var(--brand)]">
              {pricePerUsePt} pt/回
            </span>
          </div>
        </div>
      )}

      {fullScreenChat ? (
        <>
          <div className="flex-1 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card-elevated)]/40 p-4 sm:p-5">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3">
                <p className="text-[15px] text-[var(--muted)]">
                  何でも聞いてください
                </p>
                <p className="text-[12px] text-[var(--muted)]/70">
                  {pricePerUsePt} pt / 利用
                  {!isLoggedIn && " · 未ログインは1日3回まで"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={
                      m.role === "user"
                        ? "ml-auto max-w-[85%] rounded-2xl bg-[var(--accent)] px-4 py-3 text-[15px] leading-relaxed text-white"
                        : "mr-auto max-w-[85%] rounded-2xl bg-[var(--card)] px-4 py-3 text-[15px] leading-relaxed text-[var(--foreground)] ring-1 ring-[var(--border)]"
                    }
                  >
                    {m.role === "assistant" ? (
                      <pre className="whitespace-pre-wrap font-sans">
                        {uiMessagePlainText(m)}
                      </pre>
                    ) : (
                      uiMessagePlainText(m)
                    )}
                  </div>
                ))}
                {pending && (
                  <div className="mr-auto max-w-[85%] rounded-2xl bg-[var(--card)] px-4 py-3 ring-1 ring-[var(--border)]">
                    <span className="inline-flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--muted)] [animation-delay:0ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--muted)] [animation-delay:150ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--muted)] [animation-delay:300ms]" />
                    </span>
                  </div>
                )}
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
            {starters.length > 0 && messages.length === 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {starters
                  .sort((a, b) => a.position - b.position)
                  .map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      disabled={pending}
                      onClick={() => setMessage(s.text)}
                      className="max-w-full rounded-full border border-[var(--border)] bg-[var(--card-elevated)] px-3 py-1.5 text-left text-[13px] leading-snug text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
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
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !pending) {
                    e.preventDefault();
                    void run();
                  }
                }}
                rows={2}
                placeholder="メッセージを入力… (Shift+Enter で改行)"
                className="input-apple min-h-[44px] w-full resize-y border-none bg-transparent px-3 py-2 shadow-none ring-0"
              />
              <button
                type="button"
                disabled={pending || !message.trim()}
                onClick={() => void run()}
                className="btn-primary h-10 shrink-0 px-4 py-0 text-[14px]"
              >
                {pending ? "送信中…" : "送信"}
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between text-[12px] text-[var(--muted)]">
              <span>
                {balance != null && (
                  <>残高 <span className="font-medium tabular-nums text-foreground">{balance.toLocaleString("ja-JP")} pt</span></>
                )}
              </span>
              <span className="tabular-nums">
                {pricePerUsePt} pt / 利用
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
              <p className="text-label">よくある質問</p>
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
              {pending ? "処理中…" : "送信"}
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
                やりとり
              </p>
              <div className="mt-2 space-y-3">
                {messages.map((m) => (
                  <div key={m.id}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                      {m.role === "user" ? "あなた" : "返答"}
                    </p>
                    <pre className="mt-1 whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-[var(--foreground)]">
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
    </>
  );
}
