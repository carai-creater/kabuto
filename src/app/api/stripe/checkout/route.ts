import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { getPublicOrigin } from "@/lib/site-url";
import { prisma } from "@/lib/prisma";
import { POINT_PACKAGES } from "@/lib/stripe/packages";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { packageId?: string } | null;
  const pkg = POINT_PACKAGES.find((p) => p.id === body?.packageId);
  if (!pkg) {
    return NextResponse.json({ error: "invalid packageId" }, { status: 400 });
  }

  let stripe: Stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const origin = getPublicOrigin(req);

  // Stripe Customer を取得または作成
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, stripeCustomerId: true },
  });

  let customerId = user?.stripeCustomerId;
  if (!customerId && user?.email) {
    const customer = await stripe.customers.create({ email: user.email });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId ?? undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "jpy",
          unit_amount: pkg.amountYen,
          product_data: {
            name: `kabuto ポイント ${pkg.label}`,
            description: pkg.bonus || undefined,
          },
        },
      },
    ],
    metadata: {
      userId,
      packageId: pkg.id,
      amountPt: String(pkg.amountPt),
    },
    success_url: `${origin}/wallet?purchased=1`,
    cancel_url: `${origin}/wallet`,
  });

  // 購入レコードを pending で作成
  await prisma.pointPurchase.create({
    data: {
      userId,
      amountPt: pkg.amountPt,
      amountYen: pkg.amountYen,
      stripeSessionId: session.id,
      status: "pending",
    },
  });

  return NextResponse.json({ url: session.url });
}
