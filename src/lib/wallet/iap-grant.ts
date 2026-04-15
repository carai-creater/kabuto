import { lookupIapPackage } from "@/lib/wallet/iap-packages";

/**
 * Pure-function core of the IAP grant flow.
 *
 * - Idempotency: we reuse the existing unique constraint on
 *   `PointPurchase.stripeSessionId` by storing `iap_<transactionId>` there.
 *   This avoids a schema migration. The field name is a soft misnomer on
 *   the IAP path; a future Phase can rename it once we have migration
 *   headroom.
 * - Atomicity: the row insert + wallet increment run inside
 *   `prisma.$transaction` so a failure in either rolls back the other.
 * - Race safety: a concurrent second grant will lose the `create` race
 *   (unique constraint violation) and be resolved to `alreadyGranted`
 *   via the post-catch re-fetch.
 *
 * The core is Prisma-abstracted via `IapGrantDeps` so the unit test can
 * inject an in-memory fake without spinning up a real database.
 */

export type IapGrantInput = {
  userId: string;
  productId: string;
  transactionId: string;
};

export type IapGrantResult =
  | {
      ok: true;
      amountPt: number;
      alreadyGranted: boolean;
      balancePt: number;
    }
  | { ok: false; code: "unknown_product" | "wallet_missing" };

/** Minimal Prisma surface the core touches. Real Prisma satisfies this; the
 *  unit test provides an in-memory implementation. */
export interface IapGrantDeps {
  pointPurchase: {
    findUnique(args: {
      where: { stripeSessionId: string };
    }): Promise<{ id: string } | null>;
    create(args: {
      data: {
        userId: string;
        amountPt: number;
        amountYen: number;
        stripeSessionId: string;
        status: string;
      };
    }): Promise<{ id: string }>;
  };
  wallet: {
    findUnique(args: {
      where: { userId: string };
    }): Promise<{ balancePt: number } | null>;
    update(args: {
      where: { userId: string };
      data: { balancePt: { increment: number } };
    }): Promise<{ balancePt: number }>;
  };
  $transaction<T>(ops: Promise<unknown>[]): Promise<T>;
}

export async function grantIapCore(
  deps: IapGrantDeps,
  input: IapGrantInput,
): Promise<IapGrantResult> {
  const pkg = lookupIapPackage(input.productId);
  if (!pkg) {
    return { ok: false, code: "unknown_product" };
  }

  const idempotencyKey = `iap_${input.transactionId}`;

  // Fast-path: already granted.
  const existing = await deps.pointPurchase.findUnique({
    where: { stripeSessionId: idempotencyKey },
  });
  if (existing) {
    const wallet = await deps.wallet.findUnique({ where: { userId: input.userId } });
    return {
      ok: true,
      amountPt: pkg.amountPt,
      alreadyGranted: true,
      balancePt: wallet?.balancePt ?? 0,
    };
  }

  // Wallet must exist — ordinarily created by `ensurePrismaUserFromAuth`.
  const wallet = await deps.wallet.findUnique({ where: { userId: input.userId } });
  if (!wallet) {
    return { ok: false, code: "wallet_missing" };
  }

  try {
    const results = await deps.$transaction<
      [{ id: string }, { balancePt: number }]
    >([
      deps.pointPurchase.create({
        data: {
          userId: input.userId,
          amountPt: pkg.amountPt,
          amountYen: pkg.amountYen,
          stripeSessionId: idempotencyKey,
          status: "completed",
        },
      }),
      deps.wallet.update({
        where: { userId: input.userId },
        data: { balancePt: { increment: pkg.amountPt } },
      }),
    ]);
    return {
      ok: true,
      amountPt: pkg.amountPt,
      alreadyGranted: false,
      balancePt: results[1].balancePt,
    };
  } catch (err) {
    // Race loser: a concurrent grant won. Re-read and resolve idempotently.
    const raced = await deps.pointPurchase.findUnique({
      where: { stripeSessionId: idempotencyKey },
    });
    if (raced) {
      const walletAfter = await deps.wallet.findUnique({
        where: { userId: input.userId },
      });
      return {
        ok: true,
        amountPt: pkg.amountPt,
        alreadyGranted: true,
        balancePt: walletAfter?.balancePt ?? 0,
      };
    }
    throw err;
  }
}
