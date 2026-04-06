/**
 * デモログイン（Cookie `kabuto_uid`）の可否。
 * - `NEXT_PUBLIC_ENABLE_DEMO_LOGIN=true` → 常にオン
 * - `NEXT_PUBLIC_ENABLE_DEMO_LOGIN=false` → 常にオフ
 * - 未設定 → 本番はオフ、開発はオン
 */
export function isDemoLoginEnabled(): boolean {
  const v = process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN;
  if (v === "true") return true;
  if (v === "false") return false;
  return process.env.NODE_ENV !== "production";
}
