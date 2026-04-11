"use client";

import { useFormState } from "react-dom";

import { AGENT_MODEL_OPTIONS } from "@/lib/agent/model-options";
import {
  updateAgent,
  type CreateAgentState,
} from "@/app/actions/agent";

const initialState: CreateAgentState = { error: null };

export type EditAgentFormInitial = {
  slug: string;
  title: string;
  description: string;
  iconEmoji: string;
  instructions: string;
  starters: [string, string, string, string];
  defaultLlm: string;
  useRecommendedModel: boolean;
  capWebSearch: boolean;
  capCanvas: boolean;
  capImageGen: boolean;
  capCodeInterpreter: boolean;
  actionsAuthType: string;
  actionsOpenApiSchema: string;
  actionsPrivacyPolicyUrl: string;
  pricePerUsePt: number;
};

type Props = { initial: EditAgentFormInitial };

export function EditAgentForm({ initial }: Props) {
  const [state, formAction] = useFormState(updateAgent, initialState);

  return (
    <form action={formAction} encType="multipart/form-data" className="space-y-10">
      <input type="hidden" name="agentSlug" value={initial.slug} />

      <p className="text-[14px] text-[var(--muted)]">
        変更を保存するか、ストアに公開できます。
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
            defaultValue={initial.title}
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
            rows={3}
            maxLength={4000}
            className="input-apple mt-2 min-h-[88px] w-full resize-y"
            defaultValue={initial.description}
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
            defaultValue={initial.iconEmoji}
            className="input-apple mt-2 max-w-[8rem] text-center text-2xl"
            aria-describedby="icon-hint"
          />
          <p id="icon-hint" className="mt-1 text-[12px] text-[var(--muted)]">
            未入力時は 🤖
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
          <textarea
            id="instructions"
            name="instructions"
            required
            rows={12}
            className="input-apple mt-2 w-full resize-y font-mono text-[13px] leading-relaxed"
            defaultValue={initial.instructions}
          />
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          スターター（任意・最大 4）
        </h2>
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
              defaultValue={initial.starters[i]}
            />
          </div>
        ))}
      </section>

      <section className="space-y-6">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          知識
        </h2>
        <p className="text-[13px] text-[var(--muted)]">
          PDF/テキストなど（各 8MB・最大 8 件）。追加のみアップロード。
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
            defaultValue={initial.defaultLlm}
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
            defaultChecked={initial.useRecommendedModel}
            className="mt-1 h-4 w-4 rounded border-slate-300"
          />
          <span>
            <span className="text-[14px] font-medium text-foreground">
              推奨モデルとして保存
            </span>
            <span className="mt-1 block text-[12px] text-[var(--muted)]">
              オフのときは利用側がモデルを選択
            </span>
          </span>
        </label>
      </section>

      <section className="space-y-5">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          機能
        </h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <input
              id="capWebSearch"
              name="capWebSearch"
              type="checkbox"
              defaultChecked={initial.capWebSearch}
              className="mt-1 h-4 w-4 rounded border-slate-300"
            />
            <label htmlFor="capWebSearch" className="text-[14px] leading-snug">
              <span className="font-medium">ウェブ検索</span>
              <span className="mt-0.5 block text-[12px] text-[var(--muted)]">
                Brave は API キー設定時
              </span>
            </label>
          </li>
          <li className="flex items-start gap-3">
            <input
              id="capCanvas"
              name="capCanvas"
              type="checkbox"
              defaultChecked={initial.capCanvas}
              className="mt-1 h-4 w-4 rounded border-slate-300"
            />
            <label htmlFor="capCanvas" className="text-[14px] leading-snug">
              <span className="font-medium">Canvas</span>
            </label>
          </li>
          <li className="flex items-start gap-3">
            <input
              id="capImageGen"
              name="capImageGen"
              type="checkbox"
              defaultChecked={initial.capImageGen}
              className="mt-1 h-4 w-4 rounded border-slate-300"
            />
            <label htmlFor="capImageGen" className="text-[14px] leading-snug">
              <span className="font-medium">画像生成</span>
            </label>
          </li>
          <li className="flex items-start gap-3">
            <input
              id="capCodeInterpreter"
              name="capCodeInterpreter"
              type="checkbox"
              defaultChecked={initial.capCodeInterpreter}
              className="mt-1 h-4 w-4 rounded border-slate-300"
            />
            <label
              htmlFor="capCodeInterpreter"
              className="text-[14px] leading-snug"
            >
              <span className="font-medium">コードインタープリター</span>
            </label>
          </li>
        </ul>
      </section>

      <section className="space-y-6">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          アクション（OpenAPI）
        </h2>
        <p className="text-[13px] text-[var(--muted)]">
          OpenAPI で外部 API を定義（実行は別途接続）
        </p>
        <div>
          <label htmlFor="actionsAuthType" className="text-label">
            認証
          </label>
          <select
            id="actionsAuthType"
            name="actionsAuthType"
            defaultValue={initial.actionsAuthType}
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
            defaultValue={initial.actionsOpenApiSchema}
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
            defaultValue={initial.actionsPrivacyPolicyUrl}
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
          <input
            id="pricePerUsePt"
            name="pricePerUsePt"
            type="number"
            required
            min={0}
            max={10_000_000}
            defaultValue={initial.pricePerUsePt}
            className="input-apple mt-2 max-w-xs"
          />
        </div>
      </section>

      {state.error ? (
        <p className="text-[15px] text-[var(--destructive)]" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          name="intent"
          value="draft"
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          下書きで保存
        </button>
        <button
          type="submit"
          name="intent"
          value="publish"
          className="btn-primary px-8"
        >
          保存して公開
        </button>
      </div>
    </form>
  );
}
