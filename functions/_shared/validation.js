/**
 * 共有: 永続化エンドポイント（registered-libraries / search-history）の PUT 入力検証。
 * 無検証・無制限の書き込み（巨大ペイロードによるコスト/ストレージ浪費・不正形データ）
 * を入口で弾く。純粋関数なのでユニットテストしやすい（#87 L-1）。
 */

export const LIMITS = {
  maxBodyBytes: 1_000_000, // 本文サイズ上限（1MB）
  maxItems: 2000, // 配列長上限
  maxStringLen: 4000, // 個々の文字列フィールド上限
};

/** 本文（文字列）がサイズ上限を超えているか。 */
export function tooLarge(text, max = LIMITS.maxBodyBytes) {
  return typeof text === 'string' && text.length > max;
}

function isNonEmptyString(v, max = LIMITS.maxStringLen) {
  return typeof v === 'string' && v.length > 0 && v.length <= max;
}

function badRequest(error = 'bad request') {
  return { ok: false, status: 400, error };
}

function tooManyItems(error) {
  return { ok: false, status: 413, error };
}

/**
 * `{ libraries: Library[] }` を検証する。
 * @returns {{ok:true, value:any[]}|{ok:false, status:number, error:string}}
 */
export function validateLibraries(body) {
  const libraries = Array.isArray(body?.libraries) ? body.libraries : null;
  if (libraries === null) return badRequest();
  if (libraries.length > LIMITS.maxItems) return tooManyItems('too many libraries');
  for (const lib of libraries) {
    if (lib === null || typeof lib !== 'object') return badRequest('invalid library');
    if (
      !isNonEmptyString(lib.systemId) ||
      !isNonEmptyString(lib.libKey) ||
      !isNonEmptyString(lib.libId)
    ) {
      return badRequest('invalid library');
    }
  }
  return { ok: true, value: libraries };
}

/**
 * `{ entries: SearchHistoryEntry[] }` を検証する。
 * @returns {{ok:true, value:any[]}|{ok:false, status:number, error:string}}
 */
export function validateHistory(body) {
  const entries = Array.isArray(body?.entries) ? body.entries : null;
  if (entries === null) return badRequest();
  if (entries.length > LIMITS.maxItems) return tooManyItems('too many entries');
  for (const e of entries) {
    if (e === null || typeof e !== 'object') return badRequest('invalid entry');
    if (!isNonEmptyString(e.isbn) || !isNonEmptyString(e.searchedAt)) {
      return badRequest('invalid entry');
    }
    if (
      e.libraryStatuses !== undefined &&
      (e.libraryStatuses === null || typeof e.libraryStatuses !== 'object')
    ) {
      return badRequest('invalid entry');
    }
  }
  return { ok: true, value: entries };
}
