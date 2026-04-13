"use client";

import { useEffect } from "react";

import {
  IDLE_LAST_AGENT_KEY,
  IDLE_NUDGE_SENT_KEY,
  type IdleLastAgentPayload,
} from "@/lib/idle-agent-notification";

type Props = {
  slug: string;
  title: string;
  /** 通知文に使う一言（会話スターター優先） */
  hint: string;
};

/** エージェントチャット画面で、離脱後ナッジ用のメタを sessionStorage に保存する */
export function SetLastVisitedAgent({ slug, title, hint }: Props) {
  useEffect(() => {
    try {
      const prevRaw = sessionStorage.getItem(IDLE_LAST_AGENT_KEY);
      if (prevRaw) {
        const prev = JSON.parse(prevRaw) as { slug?: string };
        if (prev.slug !== slug) {
          sessionStorage.removeItem(IDLE_NUDGE_SENT_KEY);
        }
      }
      sessionStorage.setItem(
        IDLE_LAST_AGENT_KEY,
        JSON.stringify({
          slug,
          title,
          hint,
          ts: Date.now(),
        } satisfies IdleLastAgentPayload),
      );
    } catch {
      // ignore quota / private mode
    }
  }, [slug, title, hint]);

  return null;
}
