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
    <form action={formAction} className="space-y-10">
      <p className="text-[14px] leading-relaxed text-[var(--muted)]">
        ChatGPT のカスタム GPT や Gemini の GEM と同じ考え方の項目です。送信時にひとまとめのデータとして保存され、チャット実行時のシステム指示と会話スターターに使われます。
      </p>

      <section className="space-y-6">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          基本情報
        </h2>

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
          <p className="mt-1 text-[12px] text-[var(--muted)]">
            ストアや一覧に表示される短い説明（GPTs の Description に相当）
          </p>
          <textarea
            id="description"
            name="description"
            required
            rows={3}
            maxLength={4000}
            className="input-apple mt-2 min-h-[88px] w-full resize-y"
            placeholder="何をしてくれるエージェントか、利用者向けに一行〜数行で"
          />
        </div>

        <div>
          <label htmlFor="iconEmoji" className="text-label">
            アイコン（絵文字）
          </label>
          <input
            id="iconEmoji"
            name="iconEmoji"
            type="text"
            maxLength={32}
            defaultValue="🤖"
            className="input-apple mt-2 max-w-[8rem] text-center text-2xl"
            aria-describedby="icon-hint"
          />
          <p id="icon-hint" className="mt-1 text-[12px] text-[var(--muted)]">
            1 文字または絵文字 1 つを推奨（未入力は 🤖）
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          指示
        </h2>
        <div>
          <label htmlFor="instructions" className="text-label">
            指示（Instructions）
          </label>
          <p className="mt-1 text-[12px] text-[var(--muted)]">
            役割・口調・守ってほしいルール・参照してよい前提など（内部ではシステムプロンプトとして渡します）
          </p>
          <textarea
            id="instructions"
            name="instructions"
            required
            rows={14}
            className="input-apple mt-2 w-full resize-y font-mono text-[13px] leading-relaxed"
            placeholder="あなたは… という役割で、日本語で簡潔に答えます。禁止事項: …"
          />
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          会話のきっかけ（任意・最大 4）
        </h2>
        <p className="text-[13px] text-[var(--muted)]">
          チャット画面に表示する候補メッセージ（GPTs の Conversation starters と同じ用途）
        </p>
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            <label htmlFor={`starter${i}`} className="text-label">
              スターター {i + 1}
            </label>
            <input
              id={`starter${i}`}
              name={`starter${i}`}
              type="text"
              maxLength={500}
              className="input-apple mt-2 w-full"
              placeholder={i === 0 ? "例: 今日の市場の要点を3つにまとめて" : ""}
            />
          </div>
        ))}
      </section>

      <section className="space-y-6">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          価格（kabuto）
        </h2>
        <div>
          <label htmlFor="pricePerUsePt" className="text-label">
            利用価格 (pt)
          </label>
          <p className="mt-1 text-[12px] text-[var(--muted)]">
            1 回の利用あたりの消費ポイント（実際の消費はトークンに応じて変動します）
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
      </section>

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
