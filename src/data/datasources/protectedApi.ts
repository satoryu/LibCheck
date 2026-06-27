/**
 * 認証必須 API への共通 fetch ヘルパ。認証は同一オリジンの HttpOnly セッション
 * Cookie（#91）で行うため `credentials: 'same-origin'` で Cookie を送る。`token`
 * があるとき（アクティブセッション中）は後方互換で `Authorization: Bearer` も
 * 付与する（リロード後は null＝Cookie のみで認証）。200 以外は例外を投げ JSON を返す。
 */
export async function protectedRequest(
  fetchFn: typeof fetch,
  url: string,
  method: 'GET' | 'PUT',
  token: string | null,
  body?: unknown,
  timeoutMs = 10000,
): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetchFn(url, {
      method,
      credentials: 'same-origin',
      headers: {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status !== 200) {
    throw new Error(`HTTP ${response.status}`);
  }
  return JSON.parse(await response.text());
}
