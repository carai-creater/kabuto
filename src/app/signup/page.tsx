import { redirect } from "next/navigation";

/** 旧 URL 互換: `/signup` は `/login` に統合 */
export default function SignupRedirectPage() {
  redirect("/login");
}
