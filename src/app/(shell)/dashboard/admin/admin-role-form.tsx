"use client";

import { useFormState } from "react-dom";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import {
  setUserRoleByEmail,
  type SetUserRoleState,
} from "@/app/actions/admin-role";

const initial: SetUserRoleState = { error: null, success: false };

export function AdminRoleForm() {
  const [state, action] = useFormState(setUserRoleByEmail, initial);
  const shown = useRef(false);

  useEffect(() => {
    if (state.success && !shown.current) {
      toast.success("ロールを更新しました");
      shown.current = true;
    }
    if (!state.success) {
      shown.current = false;
    }
  }, [state.success]);

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="admin-email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          対象ユーザーのメールアドレス
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          required
          autoComplete="off"
          className="input-apple mt-2 w-full max-w-md"
          placeholder="user@example.com"
        />
      </div>
      <div>
        <label htmlFor="admin-role" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          付与するロール
        </label>
        <select
          id="admin-role"
          name="role"
          required
          className="input-apple mt-2 w-full max-w-xs"
          defaultValue="creator"
        >
          <option value="user">一般 (user)</option>
          <option value="creator">クリエイター (creator)</option>
          <option value="admin">管理者 (admin)</option>
        </select>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
          既定ではログイン済みユーザーはエージェント作成・クリエイターダッシュボードを利用できます。運用上の調整や管理者付与に使います。
        </p>
      </div>
      {state.error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}
      <button type="submit" className="btn-primary">
        ロールを保存
      </button>
    </form>
  );
}
