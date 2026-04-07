import { randomBytes } from "crypto";

/**
 * エージェントの URL 用スラッグ。衝突回避のためサフィックスを付与する。
 */
export function makeUniqueAgentSlug(title: string): string {
  const raw = title.trim();
  const base =
    raw
      .toLowerCase()
      .normalize("NFKC")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u3400-\u4dbf-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "agent";
  const suffix = randomBytes(4).toString("hex");
  return `${base}-${suffix}`;
}
