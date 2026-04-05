import { cookies } from "next/headers";

export const SESSION_COOKIE = "buildy_uid";

export async function getSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  const v = jar.get(SESSION_COOKIE)?.value;
  return v && v.length > 0 ? v : null;
}
