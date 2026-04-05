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
};

export function RunAgentPanel({ agentId, pricePerUsePt, starters, tools }: Props) {
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
            `ポイントが足りません（必要 ${res.required ?? pricePerUsePt} pt）。ウォレットでチャージを想定してください。`,
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
      className="rounded-2xl border border-white/10 bg-zinc-950/50 p-5 ring-1 ring-white/[0.04]"
      aria-labelledby={`${panelId}-heading`}
    >
      <h2
        id={`${panelId}-heading`}
        className="text-sm font-medium uppercase tracking-wider text-zinc-500"
      >
        実行
      </h2>

      {toolRows.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-zinc-500">接続ツール</p>
          <ul className="mt-1 flex flex-wrap gap-2">
            {toolRows.map((t) => (
              <li
                key={t.name}
                className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-zinc-300 ring-1 ring-white/10"
              >
                {t.name}
                {t.type ? (
                  <span className="text-zinc-500"> · {t.type}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr,12rem] sm:items-end">
        <div>
          <label htmlFor={`${panelId}-llm`} className="text-xs text-zinc-500">
            モデル
          </label>
          <select
            id={`${panelId}-llm`}
            value={llm}
            onChange={(e) => setLlm(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-[#D4AF37]/50 focus:ring-2 focus:ring-[#D4AF37]/25"
          >
            {LLMS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div className="text-right text-xs text-zinc-500 sm:pb-2">
          1回の消費:{" "}
          <span className="font-medium text-[#E8D48B]">
            {pricePerUsePt} pt
          </span>
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor={`${panelId}-msg`} className="text-xs text-zinc-500">
          メッセージ
        </label>
        <textarea
          id={`${panelId}-msg`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="質問を入力…"
          className="mt-1 w-full resize-y rounded-xl border border-white/10 bg-black/60 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-[#D4AF37]/50 focus:ring-2 focus:ring-[#D4AF37]/25"
        />
      </div>

      {starters.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-zinc-500">会話スターター</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {starters
              .sort((a, b) => a.position - b.position)
              .map((s) => (
                <button
                  key={s.id}
                  type="button"
                  disabled={pending}
                  onClick={() => setMessage(s.text)}
                  className="max-w-full rounded-lg border border-[#D4AF37]/25 bg-[#D4AF37]/5 px-3 py-2 text-left text-xs leading-snug text-zinc-200 transition hover:border-[#D4AF37]/45 hover:bg-[#D4AF37]/10 disabled:opacity-50"
                >
                  {s.text}
                </button>
              ))}
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={run}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-b from-[#c9a227] to-[#8a6a1a] px-5 py-2.5 text-sm font-semibold text-black shadow-[0_0_24px_-6px_rgba(212,175,55,0.55)] transition hover:brightness-110 disabled:opacity-50"
        >
          {pending ? "実行中…" : "実行（モック）"}
        </button>
        {balance != null && (
          <span className="text-xs text-zinc-500">
            残高 <span className="text-zinc-200">{balance} pt</span>
            {usageCount != null && (
              <>
                {" "}
                · 利用回数{" "}
                <span className="text-zinc-200">{usageCount}</span>
              </>
            )}
          </span>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      {reply && (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            応答
          </p>
          <pre className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
            {reply}
          </pre>
        </div>
      )}
    </section>
  );
}
