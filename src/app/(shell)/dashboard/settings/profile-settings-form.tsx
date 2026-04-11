"use client";

import { useFormState } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { Camera, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import {
  updateProfile,
  type UpdateProfileState,
} from "@/app/actions/profile";
import { createClient } from "@/utils/supabase/client";

const initialState: UpdateProfileState = { error: null, success: false, nonce: 0 };

type Props = {
  userId: string;
  email: string;
  initialName: string | null;
  initialAvatarUrl: string | null;
  initialBio: string | null;
  initialWebsiteUrl: string | null;
  initialXUrl: string | null;
};

export function ProfileSettingsForm({
  userId,
  email,
  initialName,
  initialAvatarUrl,
  initialBio,
  initialWebsiteUrl,
  initialXUrl,
}: Props) {
  const [state, formAction] = useFormState(updateProfile, initialState);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    if (state.success && state.nonce > 0) {
      toast.success("プロフィールを更新しました", {
        id: `profile-ok-${state.nonce}`,
      });
    }
  }, [state.success, state.nonce]);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) {
      toast.error("画像ファイルを選択してください");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("4MB 以下の画像にしてください");
      return;
    }
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "") || "jpg";
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) {
        toast.error("アップロードに失敗しました（バケット avatars または URL を確認）", {
          duration: 5000,
        });
        return;
      }
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      if (data.publicUrl) {
        setAvatarUrl(data.publicUrl);
        toast.success("アップロード済み。保存で反映します。");
      }
    } catch {
      toast.error("アップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={formAction} className="space-y-10">
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg ring-1 ring-black/5 dark:shadow-black/40 dark:ring-white/5">
        <h2 className="text-[15px] font-semibold text-foreground">アバター</h2>
        <p className="mt-1 text-[13px] text-[var(--muted)]">
          アップロードまたは URL
        </p>
        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-elevated)] ring-1 ring-black/5 dark:ring-white/10">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- 任意のユーザー指定 URL
              <img
                src={avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[32px] text-[var(--muted)]">
                ?
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <input type="hidden" name="avatarUrl" value={avatarUrl} />
            <label htmlFor="avatar-url-input" className="text-label">
              画像 URL
            </label>
            <input
              id="avatar-url-input"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="input-apple w-full"
              placeholder="https://example.com/avatar.png"
              autoComplete="off"
            />
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => void onPickFile(e)}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] px-4 py-2.5 text-[13px] font-medium text-foreground transition hover:bg-[var(--border)] disabled:opacity-50"
              >
                <Camera className="h-4 w-4" aria-hidden />
                {uploading ? "アップロード中…" : "ファイルをアップロード"}
              </button>
              <span className="text-[12px] text-[var(--muted)]">
                Storage バケット <code className="rounded bg-[var(--card-elevated)] px-1">avatars</code>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg ring-1 ring-black/5 dark:shadow-black/40 dark:ring-white/5">
        <h2 className="text-[15px] font-semibold text-foreground">プロフィール</h2>
        <div className="mt-6 space-y-5">
          <div>
            <label htmlFor="name" className="text-label">
              表示名
            </label>
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={initialName ?? ""}
              maxLength={200}
              className="input-apple mt-2 w-full"
              placeholder="サービス内で表示される名前"
            />
          </div>
          <div>
            <label htmlFor="bio" className="text-label">
              自己紹介
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={5}
              defaultValue={initialBio ?? ""}
              maxLength={8000}
              className="input-apple mt-2 min-h-[120px] w-full resize-y"
              placeholder="あなたや活動内容を短く紹介してください"
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg ring-1 ring-black/5 dark:shadow-black/40 dark:ring-white/5">
        <h2 className="text-[15px] font-semibold text-foreground">アカウント</h2>
        <div className="mt-6 space-y-4">
          <div>
            <span className="text-label">メールアドレス</span>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] px-4 py-3 text-[14px] text-[var(--muted)]">
                {email}
              </p>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--accent)] hover:underline"
              >
                Supabase でメール変更
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg ring-1 ring-black/5 dark:shadow-black/40 dark:ring-white/5">
        <h2 className="text-[15px] font-semibold text-foreground">SNS・リンク</h2>
        <div className="mt-6 space-y-5">
          <div>
            <label htmlFor="xUrl" className="text-label">
              X (Twitter)
            </label>
            <input
              id="xUrl"
              name="xUrl"
              type="url"
              defaultValue={initialXUrl ?? ""}
              className="input-apple mt-2 w-full"
              placeholder="https://x.com/username"
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="websiteUrl" className="text-label">
              ウェブサイト
            </label>
            <input
              id="websiteUrl"
              name="websiteUrl"
              type="url"
              defaultValue={initialWebsiteUrl ?? ""}
              className="input-apple mt-2 w-full"
              placeholder="https://example.com"
              autoComplete="off"
            />
          </div>
        </div>
      </section>

      {state.error ? (
        <p className="text-[15px] text-[var(--destructive)]" role="alert">
          {state.error}
        </p>
      ) : null}

      <button type="submit" className="btn-primary px-10">
        保存する
      </button>
    </form>
  );
}
