"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import {
  IDLE_LAST_AGENT_KEY,
  IDLE_NUDGE_SENT_KEY,
  type IdleLastAgentPayload,
} from "@/lib/idle-agent-notification";

const NUDGE_DELAY_MS = 40_000;

/** `/agents/[slug]` 以外にいるとき、しばらくしたら「エージェントからの提案」風トーストを出す */
export function IdleAgentNudge() {
  const pathname = usePathname();
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const path = pathname ?? "";
    const onAgentChatPage = /^\/agents\/[^/]+$/.test(path);

    if (onAgentChatPage) {
      sessionStorage.removeItem(IDLE_NUDGE_SENT_KEY);
      return;
    }

    let raw: string;
    try {
      raw = sessionStorage.getItem(IDLE_LAST_AGENT_KEY) ?? "";
    } catch {
      return;
    }
    if (!raw) return;

    let data: IdleLastAgentPayload;
    try {
      data = JSON.parse(raw) as IdleLastAgentPayload;
    } catch {
      return;
    }
    if (!data.slug || !data.title) return;

    const sentFor = sessionStorage.getItem(IDLE_NUDGE_SENT_KEY);
    if (sentFor === data.slug) return;

    timerRef.current = setTimeout(() => {
      try {
        if (sessionStorage.getItem(IDLE_NUDGE_SENT_KEY) === data.slug) return;
      } catch {
        return;
      }

      toast.message("エージェントからの提案", {
        description: `${data.title} — ${data.hint}`,
        duration: 14_000,
        action: {
          label: "チャットを開く",
          onClick: () => {
            router.push(`/agents/${encodeURIComponent(data.slug)}`);
          },
        },
        classNames: {
          toast: "border border-[var(--border)] shadow-lg",
        },
      });

      try {
        sessionStorage.setItem(IDLE_NUDGE_SENT_KEY, data.slug);
      } catch {
        // ignore
      }
    }, NUDGE_DELAY_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [pathname, router]);

  return null;
}
