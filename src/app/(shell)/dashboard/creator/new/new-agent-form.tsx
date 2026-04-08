"use client";

import { useFormState } from "react-dom";

import { AGENT_MODEL_OPTIONS } from "@/lib/agent/model-options";
import {
  createAgent,
  type CreateAgentState,
} from "@/app/actions/agent";

const initialState: CreateAgentState = { error: null };

export function NewAgentForm() {
  const [state, formAction] = useFormState(createAgent, initialState);

  return (
    <form action={formAction} encType="multipart/form-data" className="space-y-10">
      <p className="text-[14px] leading-relaxed text-[var(--muted)]">
        ChatGPT の GPT エディタ「構成」に近い項目です。保存すると 1
        回のリクエストで登録され、右のプレビューで試行できます。
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
            ストアや一覧に表示される短い説明
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
            未入力のときは 🤖 を使います
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
            役割・口調・ルール（システムプロンプトとして渡します）
          </p>
          <textarea
            id="instructions"
            name="instructions"
            required
            rows={12}
            className="input-apple mt-2 w-full resize-y font-mono text-[13px] leading-relaxed"
            placeholder="あなたは… という役割で、日本語で簡潔に答えます。"
          />
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          会話のきっかけ（任意・最大 4）
        </h2>
        <p className="text-[13px] text-[var(--muted)]">
          チャット開始時の候補メッセージ
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
              placeholder={i === 0 ? "例: 今日の要点を3つにまとめて" : ""}
            />
          </div>
        ))}
      </section>

      <section className="space-y-6">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          知識
        </h2>
        <p className="text-[13px] text-[var(--muted)]">
          参照用ファイル（最大 8 件・各 8MB まで）。Supabase Storage のバケット{" "}
          <code className="rounded bg-slate-100 px-1 text-[12px] dark:bg-slate-800">
            agent-knowledge
          </code>{" "}
          とサービスロールキーがあるとアップロードされます。未設定時はメタのみ保存されます。
        </p>
        <input
          name="knowledgeFiles"
          type="file"
          multiple
          accept=".pdf,.txt,.md,.csv,application/pdf,text/plain,text/csv"
          className="block w-full text-[13px] file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-[13px] file:font-medium file:text-white hover:file:bg-blue-500"
        />
      </section>

      <section className="space-y-6">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          推奨モデル
        </h2>
        <div>
          <label htmlFor="defaultLlm" className="text-label">
            既定のモデル
          </label>
          <select
            id="defaultLlm"
            name="defaultLlm"
            defaultValue="gpt-4o"
            className="input-apple mt-2 w-full max-w-md"
          >
            {AGENT_MODEL_OPTIONS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-600 dark:bg-slate-900/40">
          <input
            type="checkbox"
            name="useRecommendedModel"
            defaultChecked
            className="mt-1 h-4 w-4 rounded border-slate-300"
          />
          <span>
            <span className="text-[14px] font-medium text-foreground">
              このモデルをエージェントの推奨として保存する
            </span>
            <span className="mt-1 block text-[12px] text-[var(--muted)]">
              オフにすると「推奨モデルなし」となり、利用者がチャットでモデルを選ぶ想定です（GPT
              エディタの「推奨モデルを使用しない」に相当）。
            </span>
          </span>
        </label>
      </section>

      <section className="space-y-5">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          機能
        </h2>
        <p className="text-[13px] text-[var(--muted)]">
          有効にした機能に応じてチャット API 側のツールが切り替わります。
        </p>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <input
              id="capWebSearch"
              name="capWebSearch"
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-slate-300"
            />
            <label htmlFor="capWebSearch" className="text-[14px] leading-snug">
              <span className="font-medium">ウェブ検索</span>
              <span className="mt-0.5 block text-[12px] text-[var(--muted)]">
                BRAVE_SEARCH_API_KEY 設定時は Brave Search を利用。未設定時はツールがヒントのみ返します。
              </span>
            </label>
          </li>
          <li className="flex items-start gap-3">
            <input
              id="capCanvas"
              name="capCanvas"
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-slate-300"
            />
            <label htmlFor="capCanvas" className="text-[14px] leading-snug">
              <span className="font-medium">Canvas</span>
              <span className="mt-0.5 block text-[12px] text-[var(--muted)]">
                長文・構造化出力を指示に追加します。
              </span>
            </label>
          </li>
          <li className="flex items-start gap-3">
            <input
              id="capImageGen"
              name="capImageGen"
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-slate-300"
            />
            <label htmlFor="capImageGen" className="text-[14px] leading-snug">
              <span className="font-medium">画像生成</span>
              <span className="mt-0.5 block text-[12px] text-[var(--muted)]">
                ツール枠を有効化（画像 API 接続は運用設定後）。
              </span>
            </label>
          </li>
          <li className="flex items-start gap-3">
            <input
              id="capCodeInterpreter"
              name="capCodeInterpreter"
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-slate-300"
            />
            <label
              htmlFor="capCodeInterpreter"
              className="text-[14px] leading-snug"
            >
              <span className="font-medium">コードインタープリター</span>
              <span className="mt-0.5 block text-[12px] text-[var(--muted)]">
                実行ツール枠を有効化（サンドボックス接続は運用設定後）。
              </span>
            </label>
          </li>
        </ul>
      </section>

      <section className="space-y-6">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          アクション（OpenAPI）
        </h2>
        <p className="text-[13px] text-[var(--muted)]">
          外部 API を OpenAPI で定義します（実行パイプラインは段階的に接続可能）。認証方式とスキーマを保存します。
        </p>
        <div>
          <label htmlFor="actionsAuthType" className="text-label">
            認証
          </label>
          <select
            id="actionsAuthType"
            name="actionsAuthType"
            defaultValue="none"
            className="input-apple mt-2 w-full max-w-xs"
          >
            <option value="none">なし</option>
            <option value="api_key">API キー</option>
            <option value="oauth">OAuth</option>
          </select>
        </div>
        <div>
          <label htmlFor="actionsOpenApiSchema" className="text-label">
            スキーマ
          </label>
          <textarea
            id="actionsOpenApiSchema"
            name="actionsOpenApiSchema"
            rows={10}
            maxLength={200000}
            className="input-apple mt-2 w-full resize-y font-mono text-[12px] leading-relaxed"
            placeholder="OpenAPI 3.x の YAML または JSON を貼り付け"
          />
        </div>
        <div>
          <label htmlFor="actionsPrivacyPolicyUrl" className="text-label">
            プライバシーポリシー URL
          </label>
          <input
            id="actionsPrivacyPolicyUrl"
            name="actionsPrivacyPolicyUrl"
            type="url"
            maxLength={2000}
            className="input-apple mt-2 w-full"
            placeholder="https://example.com/privacy"
          />
        </div>
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
            目安の掲載価格（実際の消費はトークンに応じて変動）
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
        保存してプレビューを有効にする
      </button>
    </form>
  );
}
