import Link from "next/link";

export function DbUnavailableMessage() {
  return (
    <main className="relative flex flex-1 flex-col px-4 pb-24 pt-10 sm:px-6">
      <div className="relative mx-auto w-full max-w-lg rounded-2xl border border-amber-500/30 bg-amber-500/5 p-8 text-sm text-zinc-200">
        <h1 className="text-lg font-semibold text-amber-200">
          データベースに接続できません
        </h1>
        <p className="mt-3 leading-relaxed text-zinc-400">
          Vercel の{" "}
          <code className="rounded bg-black/40 px-1.5 py-0.5">DATABASE_URL</code>{" "}
          を確認し、マイグレーション（
          <code className="rounded bg-black/40 px-1">prisma migrate deploy</code>
          ）とシードを実行してください。
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-[#E8D48B] underline underline-offset-4 hover:text-white"
        >
          トップへ戻る
        </Link>
      </div>
    </main>
  );
}
