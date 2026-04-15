// Run with: npx tsx src/lib/wallet/iap-grant.test.ts
// (No kabuto-wide test runner is configured — this file stands alone.)
import assert from "node:assert/strict";
import { grantIapCore, type IapGrantDeps } from "./iap-grant";
import { parseIapJws } from "./iap-jws";

// ---- In-memory Prisma fake ----

class FakePrisma implements IapGrantDeps {
  private purchases = new Map<string, { id: string; data: unknown }>();
  public walletBalance = 0;
  private counter = 0;
  public transactionCallCount = 0;

  pointPurchase = {
    findUnique: async (args: {
      where: { stripeSessionId: string };
    }): Promise<{ id: string } | null> => {
      const row = this.purchases.get(args.where.stripeSessionId);
      return row ? { id: row.id } : null;
    },
    create: async (args: {
      data: {
        userId: string;
        amountPt: number;
        amountYen: number;
        stripeSessionId: string;
        status: string;
      };
    }): Promise<{ id: string }> => {
      if (this.purchases.has(args.data.stripeSessionId)) {
        const err: Error & { code?: string } = new Error("unique constraint");
        err.code = "P2002";
        throw err;
      }
      const id = `pp_${++this.counter}`;
      this.purchases.set(args.data.stripeSessionId, { id, data: args.data });
      return { id };
    },
  };

  wallet = {
    findUnique: async (_args: {
      where: { userId: string };
    }): Promise<{ balancePt: number } | null> => {
      return { balancePt: this.walletBalance };
    },
    update: async (args: {
      where: { userId: string };
      data: { balancePt: { increment: number } };
    }): Promise<{ balancePt: number }> => {
      this.walletBalance += args.data.balancePt.increment;
      return { balancePt: this.walletBalance };
    },
  };

  async $transaction<T>(ops: Promise<unknown>[]): Promise<T> {
    this.transactionCallCount += 1;
    const results = await Promise.all(ops);
    return results as T;
  }
}

// ---- Tests ----

async function testFirstGrantCreditsWallet() {
  const prisma = new FakePrisma();
  const r = await grantIapCore(prisma, {
    userId: "u1",
    productId: "pt_500",
    transactionId: "txn_abc",
  });
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.amountPt, 500);
  assert.equal(r.alreadyGranted, false);
  assert.equal(r.balancePt, 500);
  assert.equal(prisma.walletBalance, 500);
}

async function testDuplicateTransactionIdIsIdempotent() {
  const prisma = new FakePrisma();
  const input = {
    userId: "u1",
    productId: "pt_1100",
    transactionId: "txn_dup",
  };

  const first = await grantIapCore(prisma, input);
  const second = await grantIapCore(prisma, input);

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  if (!first.ok || !second.ok) return;
  assert.equal(first.alreadyGranted, false);
  assert.equal(second.alreadyGranted, true);
  // Wallet credited exactly once.
  assert.equal(prisma.walletBalance, 1100);
  // The fast-path on the second call means $transaction runs only once.
  assert.equal(prisma.transactionCallCount, 1);
}

async function testRaceLoserIsResolvedToAlreadyGranted() {
  const prisma = new FakePrisma();
  // Simulate a race: pre-seed the row between findUnique and create by
  // injecting it directly, then call grant. The create path will throw
  // P2002 and the re-fetch must resolve it to alreadyGranted.
  //
  // grantIapCore's own findUnique runs first; to reach the catch branch
  // we need an existing row that wasn't visible on first find. We can
  // model that by wrapping findUnique to hide the seeded row on the
  // first call only.
  let firstFindCall = true;
  const seeded = new Map<string, { id: string }>([["iap_txn_race", { id: "pp_seed" }]]);
  const raceDeps: IapGrantDeps = {
    pointPurchase: {
      findUnique: async (args) => {
        if (firstFindCall) {
          firstFindCall = false;
          return null; // hide seeded row on first read
        }
        return seeded.get(args.where.stripeSessionId) ?? null;
      },
      create: async (_args) => {
        const err: Error & { code?: string } = new Error("unique constraint");
        err.code = "P2002";
        throw err;
      },
    },
    wallet: {
      findUnique: async () => ({ balancePt: 9999 }),
      update: async () => ({ balancePt: 9999 }),
    },
    $transaction: async <T>(ops: Promise<unknown>[]): Promise<T> => {
      const results = await Promise.all(ops);
      return results as T;
    },
  };

  const r = await grantIapCore(raceDeps, {
    userId: "u1",
    productId: "pt_500",
    transactionId: "txn_race",
  });
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.alreadyGranted, true);
  assert.equal(r.balancePt, 9999);
}

async function testUnknownProductRejected() {
  const prisma = new FakePrisma();
  const r = await grantIapCore(prisma, {
    userId: "u1",
    productId: "pt_99999",
    transactionId: "whatever",
  });
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.code, "unknown_product");
  assert.equal(prisma.walletBalance, 0);
}

async function testWalletMissingRejected() {
  const prisma = new FakePrisma();
  prisma.wallet.findUnique = async () => null;
  const r = await grantIapCore(prisma, {
    userId: "u_missing",
    productId: "pt_500",
    transactionId: "txn_x",
  });
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.code, "wallet_missing");
}

async function testParseIapJwsExtractsClaims() {
  // Build a minimal JWS-looking string: header.payload.signature
  const payload = {
    transactionId: "2000000123456789",
    productId: "pt_500",
    purchaseDate: 1_700_000_000_000,
    bundleId: "com.carai.kabutoios",
  };
  const enc = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");
  const jws = `${enc({ alg: "ES256" })}.${enc(payload)}.sig`;

  const claims = parseIapJws(jws);
  assert.ok(claims, "claims should be parsed");
  if (!claims) return;
  assert.equal(claims.transactionId, "2000000123456789");
  assert.equal(claims.productId, "pt_500");
  assert.equal(claims.bundleId, "com.carai.kabutoios");
}

async function testParseIapJwsRejectsGarbage() {
  assert.equal(parseIapJws("not a jws"), null);
  assert.equal(parseIapJws("a.b"), null); // wrong segment count
  assert.equal(parseIapJws("a.notbase64!!!.c"), null);
}

// ---- Runner ----

const tests: Array<[string, () => Promise<void>]> = [
  ["first grant credits wallet", testFirstGrantCreditsWallet],
  ["duplicate transaction id is idempotent", testDuplicateTransactionIdIsIdempotent],
  ["race loser is resolved to alreadyGranted", testRaceLoserIsResolvedToAlreadyGranted],
  ["unknown product rejected", testUnknownProductRejected],
  ["wallet missing rejected", testWalletMissingRejected],
  ["parseIapJws extracts claims", testParseIapJwsExtractsClaims],
  ["parseIapJws rejects garbage", testParseIapJwsRejectsGarbage],
];

async function main() {
  let passed = 0;
  let failed = 0;
  for (const [name, fn] of tests) {
    try {
      await fn();
      console.log(`✓ ${name}`);
      passed += 1;
    } catch (err) {
      console.error(`✗ ${name}`);
      console.error(err);
      failed += 1;
    }
  }
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
