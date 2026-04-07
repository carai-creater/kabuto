import { redirect } from "next/navigation";

/** 旧パス `/creator` → 新ダッシュボードへ */
export default function LegacyCreatorRedirectPage() {
  redirect("/dashboard/creator");
}
