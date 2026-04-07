"use client";

import NextTopLoader from "nextjs-toploader";

/**
 * クライアント遷移中に画面上部へ細いプログレスバーを表示する。
 */
export function NavigationProgress() {
  return (
    <NextTopLoader
      color="#2563eb"
      height={3}
      showSpinner={false}
      crawlSpeed={200}
      initialPosition={0.08}
      shadow="0 0 14px rgba(37, 99, 235, 0.45)"
      zIndex={99999}
    />
  );
}
