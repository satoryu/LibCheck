/**
 * Cloudflare Pages Function: `/api/registered-libraries`（認証必須）
 * - GET: ログインユーザーの登録図書館一覧
 * - PUT: 全置換（body: { libraries: Library[] }）
 *
 * D1 バインディングは `env.DB`。user 識別は ID トークンの `sub`。
 */
import { requireUser, json } from '../_shared/googleAuth.js';
import { tooLarge, validateLibraries } from '../_shared/validation.js';

function libraryKeyOf(lib) {
  return `${lib.systemId}:${lib.libKey}:${lib.libId}`;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const { user, response } = await requireUser(request, env);
  if (!user) return response;

  const { results } = await env.DB.prepare(
    'SELECT library_json FROM registered_libraries WHERE user_id = ? ORDER BY created_at',
  )
    .bind(user.id)
    .all();
  const libraries = (results ?? []).map((r) => JSON.parse(r.library_json));
  return json({ libraries }, 200);
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
  const result = validateLibraries(body);
  if (!result.ok) return json({ error: result.error }, result.status);
  const libraries = result.value;

  const now = Date.now();
  const stmts = [
    env.DB.prepare('DELETE FROM registered_libraries WHERE user_id = ?').bind(
      user.id,
    ),
    ...libraries.map((lib, i) =>
      env.DB.prepare(
        'INSERT OR REPLACE INTO registered_libraries (user_id, library_key, library_json, created_at) VALUES (?, ?, ?, ?)',
      ).bind(user.id, libraryKeyOf(lib), JSON.stringify(lib), now + i),
    ),
  ];
  await env.DB.batch(stmts);
  return json({ libraries }, 200);
}
