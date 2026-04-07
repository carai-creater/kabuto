"use client";

import { useFormState } from "react-dom";

import {
  createAgent,
  type CreateAgentState,
} from "@/app/actions/agent";

const initialState: CreateAgentState = { error: null };

export function NewAgentForm() {
  const [state, formAction] = useFormState(createAgent, initialState);

  return (
    <form action={formAction} className="space-y-8">
      <div>
        <label htmlFor="title" className="text-label">
          名前
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={200}
          className="input-apple mt-2 w-full"
          placeholder="例: 株価リサーチアシスタント"
        />
      </div>

      <div>
        <label htmlFor="description" className="text-label">
          説明
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          maxLength={4000}
          className="input-apple mt-2 min-h-[100px] w-full resize-y"
          placeholder="ストアに表示される説明文"
        />
      </div>

      <div>
        <label htmlFor="systemPrompt" className="text-label">
          システムプロンプト
        </label>
        <textarea
          id="systemPrompt"
          name="systemPrompt"
          required
          rows={12}
          className="input-apple mt-2 w-full resize-y font-mono text-[13px] leading-relaxed"
          placeholder="エージェントの役割・トーン・禁止事項など"
        />
      </div>

      <div>
        <label htmlFor="pricePerUsePt" className="text-label">
          利用価格 (pt)
        </label>
        <p className="mt-1 text-[12px] text-[var(--muted)]">
          1 回の利用あたりの消費ポイント
        </p>
        <input
          id="pricePerUsePt"
          name="pricePerUsePt"
          type="number"
          required
          min={0}
          max={10_000_000}
          defaultValue={10}
          className="input-apple mt-2 max-w-xs"
        />
      </div>

      {state.error ? (
        <p className="text-[15px] text-[var(--destructive)]" role="alert">
          {state.error}
        </p>
      ) : null}

      <button type="submit" className="btn-primary px-8">
        保存する
      </button>
    </form>
  );
}
