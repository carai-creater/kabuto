import type { Metadata } from "next";
import { PAGE_SHELL } from "@/lib/page-shell";

export const metadata: Metadata = {
  title: "プライバシーポリシー — kabuto",
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

export default function PrivacyPage() {
  return (
    <div className={`${PAGE_SHELL} py-16 sm:py-24`}>
      <div className="mx-auto max-w-2xl">
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Legal</p>
        <h1 className="mt-3 text-[32px] font-bold tracking-tight text-[var(--foreground)]">
          プライバシーポリシー
        </h1>
        <p className="mt-2 text-[13px] text-[var(--muted)]">施行日：{EFFECTIVE_DATE}</p>

        <P>
          kabuto（以下「当サービス」）は、ユーザーの個人情報の取り扱いについて以下の通りプライバシーポリシーを定めます。
        </P>

        <H2>1. 収集する情報</H2>
        <P>当サービスは以下の情報を収集することがあります。</P>
        <Ol items={[
          "メールアドレス・表示名などのアカウント情報",
          "AIエージェントとのチャット履歴",
          "ポイントの購入・利用履歴",
          "お気に入り・設定情報",
          "アクセスログ（IPアドレス、ブラウザ情報等）",
          "外部サービス連携のための認証トークン（暗号化して保存）",
        ]} />

        <H2>2. 情報の利用目的</H2>
        <Ol items={[
          "サービスの提供・運営・改善",
          "ユーザーへのサポート対応",
          "不正利用の検知・防止",
          "統計データの作成（個人を特定しない形式）",
          "重要なお知らせの送信",
        ]} />

        <H2>3. 第三者への提供</H2>
        <P>
          当サービスは、以下の場合を除き、ユーザーの個人情報を第三者に提供しません。
        </P>
        <Ol items={[
          "ユーザー本人の同意がある場合",
          "法令に基づく開示要求がある場合",
          "サービス提供に必要な業務委託先への提供（守秘義務契約あり）",
        ]} />

        <H2>4. 外部サービスとの連携</H2>
        <P>
          外部サービス（GitHub、Notion 等）との連携のため入力されたトークンは、AES-256等の暗号化を施した上で
          データベースに保存します。当該トークンは、ユーザーが選択したエージェントの動作にのみ使用され、
          それ以外の目的では使用しません。
        </P>

        <H2>5. 認証・セキュリティ</H2>
        <P>
          当サービスは Supabase Authentication を利用して認証を管理します。
          パスワードは当サービスのサーバーには保存されません。
          通信は HTTPS で暗号化されます。
        </P>

        <H2>6. Cookie・アクセス解析</H2>
        <P>
          当サービスはセッション管理のために Cookie を使用します。
          ブラウザの設定により Cookie を無効にすることができますが、
          一部機能が利用できなくなる場合があります。
        </P>

        <H2>7. 個人情報の開示・訂正・削除</H2>
        <P>
          ユーザーは自身の個人情報の開示・訂正・削除を請求できます。
          アカウント設定画面から変更可能な情報については随時対応できます。
          その他の請求はサービス内のお問い合わせよりご連絡ください。
        </P>

        <H2>8. 未成年者の利用</H2>
        <P>
          13歳未満のお子様は当サービスを利用できません。
          13歳以上18歳未満の方は保護者の同意を得た上でご利用ください。
        </P>

        <H2>9. プライバシーポリシーの変更</H2>
        <P>
          当サービスは、必要に応じてプライバシーポリシーを変更することがあります。
          重要な変更がある場合はサービス上でお知らせします。
        </P>

        <H2>10. お問い合わせ・運営者</H2>
        <P>
          個人情報の取り扱いに関するお問い合わせは、サービス内のフィードバック機能またはお問い合わせフォームよりご連絡ください。
        </P>
        <P>
          運営者：carai（<a href="https://carai.homes" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 transition hover:text-[var(--foreground)]">carai.homes</a>）
        </P>
      </div>
    </div>
  );
}
