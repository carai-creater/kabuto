import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.walletTransaction.deleteMany();
  await prisma.modelConfig.deleteMany();
  await prisma.usageLedger.deleteMany();
  await prisma.review.deleteMany();
  await prisma.conversationStarter.deleteMany();
  await prisma.knowledgeDocument.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.creatorWallet.deleteMany();
  await prisma.user.deleteMany();

  const alice = await prisma.user.create({
    data: {
      email: "alice@demo.kabuto",
      name: "Alice",
      wallet: { create: { balancePt: 1000 } },
      profile: { create: { role: "user" } },
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: "bob@demo.kabuto",
      name: "Bob（クリエイター）",
      wallet: { create: { balancePt: 500 } },
      creatorWallet: { create: { balancePt: 0 } },
      profile: { create: { role: "creator" } },
    },
  });

  await prisma.user.create({
    data: {
      email: "admin@demo.kabuto",
      name: "Admin（管理者）",
      wallet: { create: { balancePt: 0 } },
      profile: { create: { role: "admin" } },
    },
  });

  const toolsResearch: Prisma.InputJsonValue = [
    { name: "web_search", type: "function", config: { engine: "brave" } },
    { name: "summarize", type: "function", config: { maxTokens: 800 } },
  ];

  const toolsStock: Prisma.InputJsonValue = [
    { name: "stock_quote", type: "http", config: { provider: "mock" } },
    { name: "news_headlines", type: "function", config: { region: "JP" } },
  ];

  await prisma.agent.create({
    data: {
      slug: "jp-research-assistant",
      creatorId: bob.id,
      title: "調査リサーチャー",
      description:
        "市場・企業の調査を要約し、根拠を意識した短い回答を返します（デモ）。",
      iconEmoji: "📊",
      systemPrompt:
        "あなたは洗練されたリサーチアシスタントです。日本語で簡潔に、箇条書きを活用して答えます。",
      pricePerUsePt: 25,
      usageCount: 128,
      ratingAvg: new Prisma.Decimal("4.6"),
      reviewCount: 24,
      firstThreeFree: true,
      isPublished: true,
      tags: ["高コスパ", "リサーチ"],
      tools: toolsResearch,
      defaultLlm: "gpt-4o",
      conversationStarters: {
        create: [
          { position: 0, text: "この業界の最近のトレンドを3つに要約して" },
          { position: 1, text: "競合AとBの違いを整理して" },
          { position: 2, text: "初回ユーザー向けの注意点は？" },
          { position: 3, text: "レポートの章立て案を出して" },
        ],
      },
      knowledgeDocuments: {
        create: [
          {
            title: "業界概要.pdf",
            mimeType: "application/pdf",
            storageKey: "demo/industry.pdf",
          },
          {
            title: "用語集.txt",
            mimeType: "text/plain",
            storageKey: "demo/glossary.txt",
          },
        ],
      },
    },
  });

  await prisma.agent.create({
    data: {
      slug: "stock-concierge",
      creatorId: bob.id,
      title: "株価コンシェルジュ",
      description:
        "銘柄のモック情報とニュース見出しを返すエージェント（デモ）。",
      iconEmoji: "📈",
      systemPrompt:
        "あなたは日本株に強いコンシェルジュです。断定的な投資助言は避け、確認すべき観点を提示します。",
      pricePerUsePt: 40,
      usageCount: 56,
      ratingAvg: new Prisma.Decimal("4.2"),
      reviewCount: 9,
      firstThreeFree: false,
      isPublished: true,
      tags: ["マーケット", "速報"],
      tools: toolsStock,
      defaultLlm: "gemini-2.0-flash",
      conversationStarters: {
        create: [
          { position: 0, text: "今日の相場の雰囲気を一言で" },
          { position: 1, text: "この銘柄を調べるときの観点は？" },
          { position: 2, text: "リスクを整理して" },
          { position: 3, text: "ニュースの見方を教えて" },
        ],
      },
      knowledgeDocuments: {
        create: [
          {
            title: "銘柄リスト.csv",
            mimeType: "text/csv",
            storageKey: "demo/symbols.csv",
          },
        ],
      },
    },
  });

  await prisma.modelConfig.createMany({
    data: [
      {
        modelId: "gpt-4o",
        label: "GPT-4o",
        inputRate: 0.6,
        outputRate: 1.8,
      },
      {
        modelId: "claude-3-5-sonnet-20241022",
        label: "Claude 3.5 Sonnet",
        inputRate: 0.7,
        outputRate: 2.1,
      },
      {
        modelId: "gemini-1.5-pro",
        label: "Gemini 1.5 Pro",
        inputRate: 0.55,
        outputRate: 1.65,
      },
      {
        modelId: "gemini-2.0-flash",
        label: "Gemini 2.0 Flash",
        inputRate: 0.35,
        outputRate: 1.0,
      },
    ],
  });

  console.log("Seed OK:", {
    alice: alice.email,
    bob: bob.email,
    admin: "admin@demo.kabuto",
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
