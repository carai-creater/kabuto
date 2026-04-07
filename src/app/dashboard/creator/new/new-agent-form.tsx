"use client";

import { useFormState } from "react-dom";
import { useState } from "react";
import { Upload } from "lucide-react";

import {
  createAgent,
  type CreateAgentState,
} from "@/app/actions/agent";

const ICON_PRESETS = ["🤖", "🎨", "📝", "💡", "🔬", "🌟", "📊", "💬", "🧠", "⚡"];

const initialState: CreateAgentState = { error: null };

export function NewAgentForm() {
  const [state, formAction] = useFormState(createAgent, initialState);
  const [icon, setIcon] = useState(ICON_PRESETS[0]);

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="iconEmoji" value={icon} />

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
          短い説明
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={3}
          maxLength={4000}
          className="input-apple mt-2 min-h-[88px] w-full resize-y"
          placeholder="ストアに表示される一言説明"
        />
      </div>

      <div>
        <p className="text-label">アイコン</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {ICON_PRESETS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setIcon(e)}
              className={`flex h-12 w-12 items-center justify-center rounded-xl border text-xl transition ${
                icon === e
                  ? "border-[var(--accent)] bg-[var(--brand-muted)] ring-2 ring-[var(--accent)]/30"
                  : "border-[var(--border)] bg-[var(--card-elevated)] hover:border-[var(--border-strong)]"
              }`}
              aria-pressed={icon === e}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="systemPrompt" className="text-label">
          指示（システムプロンプト）
        </label>
        <textarea
          id="systemPrompt"
          name="systemPrompt"
          required
          rows={12}
          className="input-apple mt-2 w-full resize-y font-mono text-[13px] leading-relaxed"
          placeholder="エージェントの振る舞い・禁止事項・出力形式などを記述"
        />
      </div>

      <div>
        <p className="text-label">知識（ナレッジ）</p>
        <div className="mt-3 rounded-xl border border-dashed border-[var(--border)] bg-[var(--card-elevated)]/60 p-8 text-center shadow-inner">
          <Upload
            className="mx-auto h-10 w-10 text-[var(--muted)]"
            aria-hidden
          />
          <p className="mt-3 text-[14px] text-[var(--muted)]">
            ファイルアップロードは近日対応です（UI のみ）
          </p>
          <button
            type="button"
            disabled
            className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-[13px] text-[var(--muted)]"
          >
            ファイルを選択（モック）
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="pricePerUsePt" className="text-label">
          利用価格 (pt)
        </label>
        <p className="mt-1 text-[12px] text-[var(--muted)]">
          ユーザーが 1 回チャット利用するごとの消費ポイント（目安）
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

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-primary px-8">
          保存して公開準備へ
        </button>
      </div>
    </form>
  );
}
