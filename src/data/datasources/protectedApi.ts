/**
 * 認証必須 API への共通 fetch ヘルパ。`Authorization: Bearer` を付与し、
 * 200 以外は例外（`HTTP <status>`）を投げ、JSON を返す。
 */
export async function protectedRequest(
  fetchFn: typeof fetch,
  url: string,
  method: 'GET' | 'PUT',
  token: string,
  body?: unknown,
  timeoutMs = 10000,
): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetchFn(url, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
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
