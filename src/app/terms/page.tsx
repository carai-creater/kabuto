import type { Metadata } from "next";
import { PAGE_SHELL } from "@/lib/page-shell";

export const metadata: Metadata = {
  title: "利用規約 — kabuto",
};

const EFFECTIVE_DATE = "2026年4月1日";

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 text-[18px] font-semibold text-[var(--foreground)]">{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-[14px] leading-relaxed text-[var(--subtle)]">{children}</p>;
}
function Ol({ items }: { items: string[] }) {
  return (
    <ol className="mt-3 list-decimal space-y-2 pl-6">
      {items.map((item, i) => (
        <li key={i} className="text-[14px] leading-relaxed text-[var(--subtle)]">{item}</li>
      ))}
    </ol>
  );
}

export default function TermsPage() {
  return (
    <div className={`${PAGE_SHELL} py-16 sm:py-24`}>
      <div className="mx-auto max-w-2xl">
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Legal</p>
        <h1 className="mt-3 text-[32px] font-bold tracking-tight text-[var(--foreground)]">利用規約</h1>
        <p className="mt-2 text-[13px] text-[var(--muted)]">施行日：{EFFECTIVE_DATE}</p>

        <P>
          本利用規約（以下「本規約」）は、kabuto（以下「当サービス」）の利用条件を定めるものです。
          ユーザーの皆様には、本規約に同意の上でご利用いただきます。
        </P>

        <H2>第1条（適用）</H2>
        <P>本規約は、当サービスの利用に関わる一切の関係に適用されます。</P>

        <H2>第2条（利用登録）</H2>
        <P>
          登録希望者は当サービスの定める方法で利用登録を申請し、当サービスが承認した時点で利用契約が成立します。
          当サービスは以下の場合に登録を拒否することがあります。
        </P>
        <Ol items={[
          "虚偽の内容が含まれる場合",
          "過去に規約違反があった場合",
          "その他、当サービスが不適切と判断した場合",
        ]} />

        <H2>第3条（ポイント・料金）</H2>
        <P>
          当サービスはポイント制を採用しています。購入したポイントはサービス内でのみ使用でき、現金への換金はできません。
          ポイントの有効期限・返金については別途定める規定に従います。
        </P>

        <H2>第4条（禁止事項）</H2>
        <P>ユーザーは以下の行為を行ってはなりません。</P>
        <Ol items={[
          "法令または公序良俗に違反する行為",
          "当サービスの運営を妨害する行為",
          "他のユーザーへの嫌がらせ・誹謗中傷",
          "当サービスのコンテンツを無断で複製・転載・販売する行為",
          "虚偽の情報を登録する行為",
          "スパムや自動化スクリプトによる大量アクセス",
          "その他、当サービスが不適切と判断する行為",
        ]} />

        <H2>第5条（コンテンツの権利）</H2>
        <P>
          ユーザーが当サービスに投稿・作成したエージェントおよびコンテンツの著作権は、原則としてそのユーザーに帰属します。
          当サービスは、サービス改善・宣伝目的でコンテンツを使用できるものとします。
        </P>

        <H2>第6条（免責事項）</H2>
        <P>
          当サービスは、サービスの内容および AI の出力結果について、正確性・完全性・有用性を保証しません。
          当サービスの利用により生じた損害について、当サービスは一切の責任を負いません。
        </P>

        <H2>第7条（サービスの変更・停止）</H2>
        <P>
          当サービスは、ユーザーへの事前通知なくサービスの内容を変更・停止することがあります。
          これによりユーザーに生じた損害について当サービスは責任を負いません。
        </P>

        <H2>第8条（利用規約の変更）</H2>
        <P>
          当サービスは、必要に応じて本規約を変更できます。変更後の規約はサービス上に掲示した時点で効力を生じます。
        </P>

        <H2>第9条（準拠法・管轄）</H2>
        <P>
          本規約の解釈は日本法に準拠します。紛争が生じた場合は、東京地方裁判所を専属的合意管轄裁判所とします。
        </P>

        <H2>第10条（運営者）</H2>
        <P>
          本サービスは carai が運営しています。<br />
          サービスサイト：<a href="https://carai.homes" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 transition hover:text-[var(--foreground)]">carai.homes</a>
        </P>
      </div>
    </div>
  );
}
