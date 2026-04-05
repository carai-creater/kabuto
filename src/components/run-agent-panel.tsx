"use client";

import { useCallback, useId, useMemo, useState, useTransition } from "react";
import { runAgentCompletion } from "@/app/actions/usage";

const LLMS = [
  { id: "gpt-4o", label: "GPT-4o" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
] as const;

type ToolRow = { name: string; type?: string };

type Props = {
  agentId: string;
  pricePerUsePt: number;
  starters: { id: string; position: number; text: string }[];
  tools: unknown;
  /** 作成者のみ true。false のときツール名は表示しない */
  showToolDetails?: boolean;
};

export function RunAgentPanel({
  agentId,
  pricePerUsePt,
  starters,
  tools,
  showToolDetails = false,
}: Props) {
  const panelId = useId();
  const [llm, setLlm] = useState<string>(LLMS[0].id);
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState<string | null>(null);
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
    setReply(null);
    const text = message.trim();
    if (!text) {
      setError("メッセージを入力するか、スターターを選んでください。");
      return;
    }
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
      setReply(res.assistantMessage);
      setBalance(res.newBalancePt);
      setUsageCount(res.usageCount);
    });
  }, [agentId, llm, message, pricePerUsePt]);

  return (
    <section
      className="surface-card p-6 sm:p-8"
      aria-labelledby={`${panelId}-heading`}
    >
      <h2
        id={`${panelId}-heading`}
        className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]"
      >
        チャット
      </h2>

      {showToolDetails && toolRows.length > 0 && (
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

      <div className="mt-8 flex flex-wrap items-center gap-4">
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
      {reply && (
        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card-elevated)] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
            応答
          </p>
          <pre className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--foreground)]">
            {reply}
          </pre>
        </div>
      )}
    </section>
  );
}
