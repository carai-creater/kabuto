import Stripe from "stripe";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "webhook secret not configured" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await req.text();
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error("[stripe/webhook] signature error:", err);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, amountPt } = session.metadata ?? {};

    if (!userId || !amountPt) {
      console.error("[stripe/webhook] missing metadata", session.id);
      return NextResponse.json({ ok: true });
    }

    const pt = parseInt(amountPt, 10);

    try {
      await prisma.$transaction([
        // 購入レコードを completed に更新
        prisma.pointPurchase.update({
          where: { stripeSessionId: session.id },
          data: { status: "completed" },
        }),
        // ウォレットにポイント追加（upsert でウォレットがない場合も対応）
        prisma.wallet.upsert({
          where: { userId },
          update: { balancePt: { increment: pt } },
          create: { userId, balancePt: pt },
        }),
      ]);
      console.log(`[stripe/webhook] +${pt}pt → user ${userId}`);
    } catch (err) {
      console.error("[stripe/webhook] db error:", err);
      return NextResponse.json({ error: "db error" }, { status: 500 });
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    await prisma.pointPurchase
      .update({
        where: { stripeSessionId: session.id },
        data: { status: "failed" },
      })
      .catch(() => null);
  }

  return NextResponse.json({ ok: true });
}
