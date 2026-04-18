"use client";

import NextTopLoader from "nextjs-toploader";

/**
 * クライアント遷移中に画面上部へ細いプログレスバーを表示する。
 */
export function NavigationProgress() {
  return (
    <NextTopLoader
      color="#d97757"
      height={2}
      showSpinner={false}
      crawlSpeed={200}
      initialPosition={0.1}
      shadow="0 0 10px rgba(217, 119, 87, 0.5)"
      zIndex={99999}
    />
  );
}
