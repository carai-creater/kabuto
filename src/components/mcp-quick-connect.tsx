"use client";

import { useMemo, useState } from "react";

type Preset = {
  key: string;
  label: string;
  serverKey: string;
  authType: "none" | "api_key" | "oauth";
  privacyPolicyUrl: string;
  instruction: string;
};

const MCP_PRESETS: Preset[] = [
  {
    key: "github",
    label: "GitHub MCP",
    serverKey: "github",
    authType: "oauth",
    privacyPolicyUrl: "https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement",
    instruction:
      "リポジトリ操作・Issue/PR 調査に使う。破壊的操作は事前確認してから実行する。",
  },
  {
    key: "notion",
    label: "Notion MCP",
    serverKey: "notion",
    authType: "oauth",
    privacyPolicyUrl: "https://www.notion.so/product/privacy-policy",
    instruction:
      "議事録・ドキュメント要約に使う。更新前に対象ページIDを確認する。",
  },
  {
    key: "slack",
    label: "Slack MCP",
    serverKey: "slack",
    authType: "oauth",
    privacyPolicyUrl: "https://slack.com/trust/privacy/privacy-policy",
    instruction:
      "進捗共有・通知送信に使う。投稿チャンネルを明示してから送信する。",
  },
];

function buildMcpOpenApiSchema(baseUrl: string): string {
  const root = baseUrl.trim().replace(/\/+$/, "") || "https://mcp.example.com";
  return `openapi: 3.1.0
info:
  title: MCP Bridge API
  version: 1.0.0
servers:
  - url: ${root}
paths:
  /mcp/execute:
    post:
      summary: Execute MCP action
      operationId: mcpExecute
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                server:
                  type: string
                action:
                  type: string
                payload:
                  type: object
              required: [server, action]
      responses:
        '200':
          description: success
          content:
            application/json:
              schema:
                type: object`;
}

function setInputValue(name: string, value: string) {
  const el = document.querySelector(`[name="${name}"]`) as
    | HTMLInputElement
    | HTMLTextAreaElement
    | HTMLSelectElement
    | null;
  if (!el) return;
  el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

function setChecked(name: string, checked: boolean) {
  const el = document.querySelector(`[name="${name}"]`) as
    | HTMLInputElement
    | null;
  if (!el) return;
  el.checked = checked;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

type Props = {
  initial?: {
    enabled?: boolean;
    serverKey?: string;
    endpointUrl?: string;
    instruction?: string;
  };
};

export function McpQuickConnect({ initial }: Props) {
  const [presetKey, setPresetKey] = useState("github");
  const selected = useMemo(
    () => MCP_PRESETS.find((p) => p.key === presetKey) ?? MCP_PRESETS[0],
    [presetKey],
  );

  return (
    <section className="space-y-6">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
        MCP かんたん接続
      </h2>

      <p className="text-[13px] text-[var(--muted)]">
        1) プリセットを選択 2) 接続先 URL を入れる 3) 保存。必要な OpenAPI と認証設定を自動入力できます。
      </p>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-elevated)] p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[12rem] flex-1">
            <label htmlFor="mcpPreset" className="text-label">
              プリセット
            </label>
            <select
              id="mcpPreset"
              value={presetKey}
              onChange={(e) => setPresetKey(e.target.value)}
              className="input-apple mt-2 w-full"
            >
              {MCP_PRESETS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-[13px] font-semibold text-foreground transition hover:border-[var(--accent)]/40"
            onClick={() => {
              const endpoint =
                (
                  document.querySelector(`[name="mcpEndpointUrl"]`) as
                    | HTMLInputElement
                    | null
                )?.value ?? "";
              setChecked("mcpEnabled", true);
              setInputValue("mcpServerKey", selected.serverKey);
              setInputValue("mcpInstruction", selected.instruction);
              setInputValue("actionsAuthType", selected.authType);
              setInputValue(
                "actionsOpenApiSchema",
                buildMcpOpenApiSchema(endpoint),
              );
              if (selected.privacyPolicyUrl) {
                setInputValue(
                  "actionsPrivacyPolicyUrl",
                  selected.privacyPolicyUrl,
                );
              }
            }}
          >
            プリセットを適用
          </button>
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-600 dark:bg-slate-900/40">
        <input
          id="mcpEnabled"
          type="checkbox"
          name="mcpEnabled"
          defaultChecked={initial?.enabled ?? false}
          className="mt-1 h-4 w-4 rounded border-slate-300"
        />
        <span>
          <span className="text-[14px] font-medium text-foreground">
            MCP 連携を有効化
          </span>
          <span className="mt-1 block text-[12px] text-[var(--muted)]">
            オフのときは通常チャットのみ
          </span>
        </span>
      </label>

      <div>
        <label htmlFor="mcpServerKey" className="text-label">
          MCP サーバー識別子
        </label>
        <input
          id="mcpServerKey"
          name="mcpServerKey"
          type="text"
          maxLength={100}
          defaultValue={initial?.serverKey ?? ""}
          className="input-apple mt-2 w-full"
          placeholder="例: github"
        />
      </div>

      <div>
        <label htmlFor="mcpEndpointUrl" className="text-label">
          MCP ブリッジ URL
        </label>
        <input
          id="mcpEndpointUrl"
          name="mcpEndpointUrl"
          type="url"
          maxLength={2000}
          defaultValue={initial?.endpointUrl ?? ""}
          className="input-apple mt-2 w-full"
          placeholder="https://mcp.example.com"
        />
      </div>

      <div>
        <label htmlFor="mcpInstruction" className="text-label">
          MCP 利用ルール（任意）
        </label>
        <textarea
          id="mcpInstruction"
          name="mcpInstruction"
          rows={3}
          maxLength={5000}
          defaultValue={initial?.instruction ?? ""}
          className="input-apple mt-2 w-full resize-y"
          placeholder="例: リポジトリ更新前は変更内容を要約して確認をとる"
        />
      </div>
    </section>
  );
}
