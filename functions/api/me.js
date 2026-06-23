/**
 * Cloudflare Pages Function: `GET /api/me`
 *
 * 認証済みユーザーを返す。検証ロジックは `_shared/googleAuth.js` を共有利用。
 */
import { requireUser, json } from '../_shared/googleAuth.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const { user, response } = await requireUser(request, env);
  if (!user) return response;
  return json(user, 200);
}
