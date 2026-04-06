"use client";

import { useCallback, useId, useMemo, useState, useTransition } from "react";
import { runAgentCompletion } from "@/app/actions/usage";

const LLMS = [
  { id: "gpt-4o", label: "GPT-4o" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
] as const;

type ToolRow = { name: string; type?: string };
type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

type Props = {
  agentId: string;
  pricePerUsePt: number;
  starters: { id: string; position: number; text: string }[];
  tools: unknown;
  /** 作成者のみ true。false のときツール名は表示しない */
  showToolDetails?: boolean;
  fullScreenChat?: boolean;
};

export function RunAgentPanel({
  agentId,
  pricePerUsePt,
  starters,
  tools,
  showToolDetails = false,
  fullScreenChat = false,
}: Props) {
  const panelId = useId();
  const [llm, setLlm] = useState<string>(LLMS[0].id);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [usageCount, setUsageCount] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const toolRows = useMemo(() => {
    if (!Array.isArray(tools)) return [] as ToolRow[];
    return tools.filter((t): t is ToolRow => t != null && typeof t === "object");
  }, [tools]);

  const run = useCallback(() => {
    setError(null);
    const text = message.trim();
    if (!text) {
      setError("メッセージを入力するか、スターターを選んでください。");
      return;
    }
    const userMessageId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}-u`;
    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: "user", content: text },
    ]);
    setMessage("");
    const idempotencyKey =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    startTransition(async () => {
      const res = await runAgentCompletion({
        agentId,
        idempotencyKey,
        selectedLlm: llm,
        userMessage: text,
      });
      if (!res.ok) {
        if (res.code === "UNAUTHORIZED") {
          setError("デモでユーザーを選んでから実行してください（/demo）。");
        } else if (res.code === "INSUFFICIENT") {
          setError(
            `ポイントが足りません（必要 ${res.required ?? pricePerUsePt} pt）。`,
          );
        } else {
          setError("実行に失敗しました。しばらくしてから再度お試しください。");
        }
        return;
      }
      const assistantMessageId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}-a`;
      setMessages((prev) => [
        ...prev,
        { id: assistantMessageId, role: "assistant", content: res.assistantMessage },
      ]);
      setBalance(res.newBalancePt);
      setUsageCount(res.usageCount);
    });
  }, [agentId, llm, message, pricePerUsePt]);

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
            1回{" "}
            <span className="font-semibold tabular-nums text-[var(--brand)]">
              {pricePerUsePt} pt
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
                      <pre className="whitespace-pre-wrap">{m.content}</pre>
                    ) : (
                      m.content
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          {error && (
            <p className="mt-3 text-[14px] text-[var(--destructive)]" role="alert">
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
                onClick={run}
                className="btn-primary h-10 shrink-0 px-4 py-0 text-[14px]"
              >
                {pending ? "送信中…" : "送信"}
              </button>
            </div>
            <div className="mt-2 text-right text-[12px] text-[var(--muted)]">
              1回{" "}
              <span className="font-semibold tabular-nums text-[var(--brand)]">
                {pricePerUsePt} pt
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
              {usageCount != null && (
                <>
                  {" "}
                  · 利用{" "}
                  <span className="font-medium tabular-nums text-foreground">
                    {usageCount}
                  </span>
                </>
              )}
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
              onClick={run}
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
                {usageCount != null && (
                  <>
                    {" "}
                    · 利用{" "}
                    <span className="font-medium tabular-nums text-foreground">
                      {usageCount}
                    </span>
                  </>
                )}
              </span>
            )}
          </div>
          {error && (
            <p className="mt-4 text-[15px] text-[var(--destructive)]" role="alert">
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
                      {m.content}
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
