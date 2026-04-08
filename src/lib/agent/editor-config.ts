import type { Prisma } from "@prisma/client";

/** ChatGPT GPT エディタの「構成」に相当する保存形式（`Agent.toolConfig` 内） */
export type KabutoEditorCapabilities = {
  webSearch: boolean;
  canvas: boolean;
  imageGeneration: boolean;
  codeInterpreter: boolean;
};

export type KabutoEditorActionsAuth = "none" | "api_key" | "oauth";

export type KabutoEditorActions = {
  authType: KabutoEditorActionsAuth;
  /** OpenAPI 3.x の YAML / JSON テキスト */
  openApiSchema: string;
  privacyPolicyUrl: string;
};

export type KabutoEditorConfig = {
  capabilities: KabutoEditorCapabilities;
  actions: KabutoEditorActions;
  /** false のとき「推奨モデルなし」— 利用者がチャットでモデルを選ぶ（GPT エディタと同様） */
  useRecommendedModel: boolean;
};

const defaultCapabilities: KabutoEditorCapabilities = {
  webSearch: false,
  canvas: false,
  imageGeneration: false,
  codeInterpreter: false,
};

const defaultActions: KabutoEditorActions = {
  authType: "none",
  openApiSchema: "",
  privacyPolicyUrl: "",
};

export function parseKabutoEditor(
  toolConfig: unknown,
): KabutoEditorConfig | null {
  if (!toolConfig || typeof toolConfig !== "object") return null;
  const raw = (toolConfig as { kabutoEditor?: unknown }).kabutoEditor;
  if (!raw || typeof raw !== "object") return null;
  const k = raw as Record<string, unknown>;
  const cap = k.capabilities;
  const act = k.actions;
  const capabilities: KabutoEditorCapabilities = {
    webSearch:
      typeof cap === "object" && cap !== null && "webSearch" in cap
        ? Boolean((cap as { webSearch?: unknown }).webSearch)
        : defaultCapabilities.webSearch,
    canvas:
      typeof cap === "object" && cap !== null && "canvas" in cap
        ? Boolean((cap as { canvas?: unknown }).canvas)
        : defaultCapabilities.canvas,
    imageGeneration:
      typeof cap === "object" && cap !== null && "imageGeneration" in cap
        ? Boolean((cap as { imageGeneration?: unknown }).imageGeneration)
        : defaultCapabilities.imageGeneration,
    codeInterpreter:
      typeof cap === "object" && cap !== null && "codeInterpreter" in cap
        ? Boolean((cap as { codeInterpreter?: unknown }).codeInterpreter)
        : defaultCapabilities.codeInterpreter,
  };
  const authRaw = act && typeof act === "object" ? (act as { authType?: string }).authType : "none";
  const authType: KabutoEditorActionsAuth =
    authRaw === "api_key" || authRaw === "oauth" ? authRaw : "none";
  const actions: KabutoEditorActions = {
    authType,
    openApiSchema:
      typeof act === "object" && act !== null && "openApiSchema" in act
        ? String((act as { openApiSchema?: unknown }).openApiSchema ?? "")
        : "",
    privacyPolicyUrl:
      typeof act === "object" && act !== null && "privacyPolicyUrl" in act
        ? String((act as { privacyPolicyUrl?: unknown }).privacyPolicyUrl ?? "")
        : "",
  };
  const useRecommendedModel =
    typeof k.useRecommendedModel === "boolean"
      ? k.useRecommendedModel
      : true;

  return { capabilities, actions, useRecommendedModel };
}

export function buildKabutoToolConfig(input: {
  capabilities: KabutoEditorCapabilities;
  actions: KabutoEditorActions;
  useRecommendedModel: boolean;
}): Prisma.InputJsonValue {
  return {
    kabutoEditor: {
      capabilities: input.capabilities,
      actions: input.actions,
      useRecommendedModel: input.useRecommendedModel,
    },
  };
}

/** システムプロンプト用の追記（生の toolConfig JSON はモデルに渡さない） */
export function buildEditorSystemSupplement(editor: KabutoEditorConfig | null): string {
  if (!editor) return "";
  const lines: string[] = [];
  const c = editor.capabilities;
  if (c.webSearch) {
    lines.push(
      "【機能】ウェブ検索が有効です。最新情報が必要なときは webSearch ツールを使ってから答えてください。",
    );
  }
  if (c.canvas) {
    lines.push(
      "【機能】Canvas 相当: 長文・ドキュメント・表などは見出しと箇条書きで構造化して出力してください。",
    );
  }
  if (c.imageGeneration) {
    lines.push(
      "【機能】画像生成が有効です。generateImage ツールで画像生成を依頼できます（環境により未接続の場合があります）。",
    );
  }
  if (c.codeInterpreter) {
    lines.push(
      "【機能】コード実行が有効です。数値計算やデータの検証には runPython ツールを優先してください（サンドボックス環境により制限があります）。",
    );
  }
  const schema = editor.actions.openApiSchema.trim();
  if (schema.length > 0) {
    const excerpt = schema.length > 12_000 ? `${schema.slice(0, 12_000)}\n…(省略)` : schema;
    lines.push(
      `【カスタムアクション】OpenAPI 定義が登録されています。認証タイプ: ${editor.actions.authType}。スキーマ抜粋:\n${excerpt}`,
    );
  }
  const privacy = editor.actions.privacyPolicyUrl.trim();
  if (privacy.length > 0) {
    lines.push(`【プライバシー】外部アクション利用時のポリシー URL: ${privacy}`);
  }
  return lines.join("\n\n");
}
