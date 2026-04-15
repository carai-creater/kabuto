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

    try {
      // セキュリティ: userId / pt を metadata ではなく DB の PointPurchase 行から取得する。
      // metadata は checkout 作成時に付与されるが、source of truth は pending レコード。
      // 冪等化: pending のときだけ completed に遷移し、その時だけウォレット加算する。
      // Stripe は webhook をリトライ/再送するため、updateMany の count == 0 なら既処理。
      const result = await prisma.$transaction(async (tx) => {
        const purchase = await tx.pointPurchase.findUnique({
          where: { stripeSessionId: session.id },
          select: { userId: true, amountPt: true, status: true },
        });
        if (!purchase) {
          console.error("[stripe/webhook] no matching PointPurchase", session.id);
          return { alreadyProcessed: true as const };
        }
        if (purchase.status !== "pending") {
          return { alreadyProcessed: true as const };
        }
        const updated = await tx.pointPurchase.updateMany({
          where: { stripeSessionId: session.id, status: "pending" },
          data: { status: "completed" },
        });
        if (updated.count === 0) {
          return { alreadyProcessed: true as const };
        }
        await tx.wallet.upsert({
          where: { userId: purchase.userId },
          update: { balancePt: { increment: purchase.amountPt } },
          create: { userId: purchase.userId, balancePt: purchase.amountPt },
        });
        return {
          alreadyProcessed: false as const,
          userId: purchase.userId,
          pt: purchase.amountPt,
        };
      });

      if (result.alreadyProcessed) {
        console.log(`[stripe/webhook] duplicate event ignored: ${session.id}`);
      } else {
        console.log(`[stripe/webhook] +${result.pt}pt → user ${result.userId}`);
      }
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
