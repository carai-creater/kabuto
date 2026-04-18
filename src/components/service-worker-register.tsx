"use client";

import { useEffect } from "react";

/**
 * Service Worker の登録をアプリ起動時に行う。
 * layout.tsx に埋め込んでおくだけでOK。
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.error("[sw] registration failed:", err));
    }
  }, []);

  return null;
}
