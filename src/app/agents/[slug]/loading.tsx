/** エージェント詳細ページ — サーバー描画完了前に即表示するスケルトン */
export default function AgentLoading() {
  return (
    <main className="flex min-h-screen w-full flex-1 flex-col">
      {/* チャットエリア骨格 */}
      <div className="flex flex-1 flex-col">
        {/* ヘッダー部分 */}
        <div className="border-b border-[var(--border)] px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-4xl items-center gap-3">
            <div className="h-9 w-9 animate-pulse rounded-xl bg-[var(--border)]" />
            <div className="h-5 w-40 animate-pulse rounded bg-[var(--border)]" />
          </div>
        </div>

        {/* メッセージエリア */}
        <div className="flex-1 px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-4xl space-y-4">
            {/* 会話スターター */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-2xl bg-[var(--border)]"
                  style={{ animationDelay: `${i * 60}ms` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 入力エリア */}
        <div className="border-t border-[var(--border)] px-4 py-4 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="h-12 animate-pulse rounded-2xl bg-[var(--border)]" />
          </div>
        </div>
      </div>
    </main>
  );
}
