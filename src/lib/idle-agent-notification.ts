/** sessionStorage: 最後に開いたエージェント（チャット外ナッジ用） */
export const IDLE_LAST_AGENT_KEY = "kabuto_last_agent";
/** sessionStorage: 既にナッジを出した slug（同じ離脱サイクルで重複しない） */
export const IDLE_NUDGE_SENT_KEY = "kabuto_idle_nudge_sent_for_slug";

export type IdleLastAgentPayload = {
  slug: string;
  title: string;
  hint: string;
  ts: number;
};
