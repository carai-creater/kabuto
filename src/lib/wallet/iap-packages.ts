/**
 * StoreKit product ID → on-platform point package.
 *
 * These IDs are *placeholders* (`pt_500`, `pt_1100`, `pt_3500`) and must
 * match whatever is registered in App Store Connect. The iOS app pulls
 * the same IDs from a co-located source (`WalletPackage.swift`).
 *
 * Amounts intentionally mirror the existing Stripe package structure
 * (see `src/lib/stripe/packages.ts`) so iOS ↔ web purchases credit the
 * same balance. `amountYen` is informational only on the IAP path —
 * Apple handles money and we never see it; we record it for parity
 * with the existing `PointPurchase` rows created by the Stripe webhook.
 */

export type IapPackage = {
  productId: string;
  amountPt: number;
  amountYen: number;
  label: string;
};

export const IAP_PACKAGES: Record<string, IapPackage> = {
  pt_500: {
    productId: "pt_500",
    amountPt: 500,
    amountYen: 500,
    label: "500 pt",
  },
  pt_1100: {
    productId: "pt_1100",
    amountPt: 1100,
    amountYen: 1000,
    label: "1,100 pt (+100 bonus)",
  },
  pt_3500: {
    productId: "pt_3500",
    amountPt: 3500,
    amountYen: 3000,
    label: "3,500 pt (+500 bonus)",
  },
};

export function lookupIapPackage(productId: string): IapPackage | null {
  return IAP_PACKAGES[productId] ?? null;
}
