import type { Metadata } from "next";
import Link from "next/link";
import { PAGE_SHELL } from "@/lib/page-shell";

export const metadata: Metadata = {
  title: "kabuto について — kabuto",
  description: "kabuto は誰でも使える AI エージェントのマーケットプレイスです。",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-[20px] font-semibold tracking-tight text-[var(--foreground)]">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-[var(--subtle)]">{children}</div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <div className={`${PAGE_SHELL} py-16 sm:py-24`}>
      <div className="mx-auto max-w-2xl">
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">About</p>
        <h1 className="mt-3 text-[36px] font-bold tracking-tight text-[var(--foreground)] sm:text-[44px]">
          kabuto について
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--subtle)]">
          kabuto は、AI エージェントを誰でも作れて・使えるマーケットプレイスです。
          繰り返しの仕事を自動化し、あなたの時間をもっと大切なことに使ってください。
        </p>
        <p className="mt-2 text-[13px] text-[var(--muted)]">
          運営：
          <Link
            href="https://carai.homes"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition hover:text-[var(--foreground)]"
          >
            carai
          </Link>
        </p>

        <div className="mt-12 space-y-10">
          <Section title="ミッション">
            <p>
              「AI を使いこなすのは、エンジニアだけじゃない」という信念から、kabuto は生まれました。
              ライティング・メール作成・データ整理・アイデア出しなど、日常業務のあらゆる場面で
              AI が力になれるはずです。
            </p>
            <p>
              専門知識がなくても、すぐに使える AI エージェントを誰でもアクセスできる場所を作ることが私たちの目標です。
            </p>
          </Section>

          <Section title="サービスの特徴">
            <ul className="space-y-3">
              {[
                ["マーケットプレイス", "クリエイターが作った高品質な AI エージェントを即利用できます。"],
                ["ポイント制", "使った分だけ支払うシンプルな従量課金。初回は無料で試せます。"],
                ["外部サービス連携", "GitHub・Notion・Slack など主要サービスとシームレスに連携。"],
                ["誰でもクリエイターに", "プロンプトを書くだけで、あなたの AI エージェントを公開・収益化できます。"],
              ].map(([title, desc]) => (
                <li key={title} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand-muted)] text-[11px] font-bold text-[var(--accent)]">✓</span>
                  <span><strong className="font-semibold text-[var(--foreground)]">{title}</strong>：{desc}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="お問い合わせ">
            <p>
              ご質問・ご要望・不具合報告は、サービス内のフィードバック機能またはメールにてお受けしています。
              クリエイターとして参加をご希望の方もお気軽にご連絡ください。
            </p>
          </Section>
        </div>

        <div className="mt-14 flex flex-wrap gap-3">
          <Link href="/agents" className="btn-primary px-6 py-3 text-[14px]">
            エージェントを探す
          </Link>
          <Link
            href="/dashboard/creator/new"
            className="rounded-full border border-[var(--border)] bg-[var(--card)] px-6 py-3 text-[14px] font-medium text-[var(--foreground)] transition hover:border-[var(--accent)]/40"
          >
            エージェントを作る
          </Link>
        </div>
      </div>
    </div>
  );
}
