# kabuto

AI エージェント・マーケットプレイス（Next.js App Router + Tailwind + Prisma + Postgres）。要件は `requirements.md` を参照。

## セットアップ

1. **Postgres**（例: Docker）

```bash
docker compose up -d
```

2. **環境変数** — `.env.example` を参考に `.env` を用意（`DATABASE_URL` は Supabase の接続文字列でも可）。

3. **マイグレーションとシード**

```bash
npx prisma migrate deploy
npm run db:seed
```

開発時にスキーマを直接反映する場合は `npm run db:push` でも可。

4. **開発サーバー**

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開き、`/demo` でデモユーザーを選んでからエージェントを実行してください。

## 実装の要点

- **課金**: `UsageLedger` の `idempotencyKey`（ユニーク）と `createMany({ skipDuplicates: true })` で二重課金を防止し、同一トランザクションでウォレット減算・利用回数・クリエイター報酬を更新（`src/lib/usage/completeUsage.ts`）。
- **実行フロー**: モック LLM 応答成功後にのみ `completeUsageTransaction` を呼び出し（`src/app/actions/usage.ts`）。本番では Vercel AI SDK 等で置き換え。
- **Prisma**: ORM として採用（Postgres / Supabase 互換）。`CREATOR_REVENUE_SHARE` で還元率を調整。

## スクリプト

| コマンド | 説明 |
|----------|------|
| `npm run dev` | 開発サーバー |
| `npm run build` | `prisma generate` のあと本番ビルド |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:push` | スキーマを DB にプッシュ |
| `npm run db:seed` | デモデータ投入 |
