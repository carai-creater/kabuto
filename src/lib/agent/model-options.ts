/** エージェント作成・チャットで共通利用するモデル一覧 */
export const AGENT_MODEL_OPTIONS = [
  { id: "gpt-4o", label: "GPT-4o" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
] as const;

export type AgentModelId = (typeof AGENT_MODEL_OPTIONS)[number]["id"];

export const DEFAULT_AGENT_MODEL_ID: AgentModelId = "gpt-4o";

export function coerceAgentModelId(id: string | undefined): AgentModelId {
  if (!id) return DEFAULT_AGENT_MODEL_ID;
  return AGENT_MODEL_OPTIONS.some((m) => m.id === id)
    ? (id as AgentModelId)
    : DEFAULT_AGENT_MODEL_ID;
}
