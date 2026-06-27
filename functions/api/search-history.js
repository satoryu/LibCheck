/**
 * Cloudflare Pages Function: `/api/search-history`（認証必須）
 * - GET: ログインユーザーの検索履歴一覧（新しい順）
 * - PUT: 全置換（body: { entries: SearchHistoryEntry[] }、searchedAt は ISO 文字列）
 */
import { requireUser, json } from '../_shared/googleAuth.js';
import { tooLarge, validateHistory } from '../_shared/validation.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const { user, response } = await requireUser(request, env);
  if (!user) return response;

  const { results } = await env.DB.prepare(
    'SELECT isbn, searched_at, statuses_json FROM search_history WHERE user_id = ? ORDER BY searched_at DESC',
  )
    .bind(user.id)
    .all();
  const entries = (results ?? []).map((r) => ({
    isbn: r.isbn,
    searchedAt: r.searched_at,
    libraryStatuses: JSON.parse(r.statuses_json),
  }));
  return json({ entries }, 200);
}

export async function onRequestPut(context) {
  const { request, env } = context;
  const { user, response } = await requireUser(request, env);
  if (!user) return response;

  const text = await request.text();
  if (tooLarge(text)) return json({ error: 'payload too large' }, 413);
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: 'bad request' }, 400);
  }
  const result = validateHistory(body);
  if (!result.ok) return json({ error: result.error }, result.status);
  const entries = result.value;

  const stmts = [
    env.DB.prepare('DELETE FROM search_history WHERE user_id = ?').bind(user.id),
    ...entries.map((e) =>
      env.DB.prepare(
        'INSERT OR REPLACE INTO search_history (user_id, isbn, searched_at, statuses_json) VALUES (?, ?, ?, ?)',
      ).bind(
        user.id,
        e.isbn,
        e.searchedAt,
        JSON.stringify(e.libraryStatuses ?? {}),
      ),
    ),
  ];
  await env.DB.batch(stmts);
  return json({ entries }, 200);
}
