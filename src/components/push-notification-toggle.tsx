"use client";

import { Bell, BellOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type Status = "unsupported" | "denied" | "subscribed" | "unsubscribed" | "loading";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr.buffer;
}

export function PushNotificationToggle() {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }

    // 既存のサブスクリプション確認
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setStatus(sub ? "subscribed" : "unsubscribed");
    }).catch(() => setStatus("unsubscribed"));
  }, []);

  async function subscribe() {
    setStatus("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const json = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });

      setStatus("subscribed");
    } catch (err) {
      console.error("[push] subscribe error:", err);
      if (Notification.permission === "denied") {
        setStatus("denied");
      } else {
        setStatus("unsubscribed");
      }
    }
  }

  async function unsubscribe() {
    setStatus("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("unsubscribed");
    } catch (err) {
      console.error("[push] unsubscribe error:", err);
      setStatus("subscribed");
    }
  }

  if (status === "unsupported") return null;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          AIエージェントからの通知
        </p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {status === "subscribed"
            ? "提案・リマインダーを受け取っています"
            : status === "denied"
            ? "ブラウザで通知がブロックされています"
            : "エージェントが最適なタイミングで提案します"}
        </p>
      </div>

      {status === "loading" ? (
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      ) : status === "subscribed" ? (
        <button
          type="button"
          onClick={unsubscribe}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--accent)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--accent)] transition hover:bg-[var(--accent)]/20"
        >
          <Bell className="h-3.5 w-3.5" />
          ON
        </button>
      ) : status === "denied" ? (
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-400 dark:bg-slate-800">
          <BellOff className="h-3.5 w-3.5" />
          ブロック中
        </span>
      ) : (
        <button
          type="button"
          onClick={subscribe}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <BellOff className="h-3.5 w-3.5" />
          OFF
        </button>
      )}
    </div>
  );
}
