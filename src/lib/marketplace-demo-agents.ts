import { Prisma } from "@prisma/client";

import type { AgentListItem } from "@/components/agent-directory";

/** DB 未設定・接続失敗・0 件時に表示するサンプル（閲覧用。詳細はログイン導線へ） */
export function getMarketplaceDemoAgents(): AgentListItem[] {
  return [
    {
      id: "demo-marketplace-1",
      slug: "__demo-writing",
      title: "ライティング・パートナー",
      description:
        "ブログや報告書のたたき台を、トーンを指定して短時間で整えます（サンプル表示）。",
      iconEmoji: "✍️",
      pricePerUsePt: 15,
      usageCount: 1840,
      ratingAvg: new Prisma.Decimal("4.7"),
      reviewCount: 128,
      firstThreeFree: true,
      tags: ["文章", "ビジネス"],
      createdAt: new Date("2025-11-02T12:00:00.000Z"),
    },
    {
      id: "demo-marketplace-2",
      slug: "__demo-code",
      title: "コード・レビュアー",
      description:
        "差分を読み、バグの芽と可読性の改善点を箇条書きで返します（サンプル表示）。",
      iconEmoji: "💻",
      pricePerUsePt: 20,
      usageCount: 960,
      ratingAvg: new Prisma.Decimal("4.5"),
      reviewCount: 54,
      firstThreeFree: true,
      tags: ["開発", "品質"],
      createdAt: new Date("2025-12-10T09:00:00.000Z"),
    },
    {
      id: "demo-marketplace-3",
      slug: "__demo-research",
      title: "リサーチ・ナビ",
      description:
        "論点の整理と次に調べるべきキーワードを提案します（サンプル表示）。",
      iconEmoji: "🔭",
      pricePerUsePt: 25,
      usageCount: 720,
      ratingAvg: new Prisma.Decimal("4.6"),
      reviewCount: 41,
      firstThreeFree: false,
      tags: ["調査", "要約"],
      createdAt: new Date("2026-01-05T15:30:00.000Z"),
    },
    {
      id: "demo-marketplace-4",
      slug: "__demo-meeting",
      title: "ミーティング・スクリブ",
      description:
        "議事メモからアクションアイテムと期限の候補を抽出します（サンプル表示）。",
      iconEmoji: "📝",
      pricePerUsePt: 18,
      usageCount: 512,
      ratingAvg: new Prisma.Decimal("4.3"),
      reviewCount: 22,
      firstThreeFree: true,
      tags: ["会議", "生産性"],
      createdAt: new Date("2026-02-01T08:00:00.000Z"),
    },
    {
      id: "demo-marketplace-5",
      slug: "__demo-lang",
      title: "言語コンシェルジュ",
      description:
        "自然な言い換えと文化ニュアンスのヒントを日本語・英語で（サンプル表示）。",
      iconEmoji: "🌐",
      pricePerUsePt: 12,
      usageCount: 1340,
      ratingAvg: new Prisma.Decimal("4.8"),
      reviewCount: 201,
      firstThreeFree: true,
      tags: ["翻訳", "学習"],
      createdAt: new Date("2025-10-18T11:20:00.000Z"),
    },
    {
      id: "demo-marketplace-6",
      slug: "__demo-visual",
      title: "ビジュアル・ディレクター",
      description:
        "バナーやスライドの構成案と配色の方向性を短く提案します（サンプル表示）。",
      iconEmoji: "🎨",
      pricePerUsePt: 22,
      usageCount: 410,
      ratingAvg: new Prisma.Decimal("4.4"),
      reviewCount: 17,
      firstThreeFree: false,
      tags: ["デザイン", "提案"],
      createdAt: new Date("2026-03-20T14:00:00.000Z"),
    },
  ];
}

export function isDemoSlug(slug: string): boolean {
  return slug.startsWith("__demo");
}
