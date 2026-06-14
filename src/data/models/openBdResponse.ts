/**
 * OpenBD `/get` API レスポンスの 1 件分の最小 DTO。
 *
 * OpenBD のレスポンスは `[ {summary, onix, hanmoto} | null, ... ]` という配列で、
 * 該当が無い ISBN は要素が `null` になる。本アプリで必要なのは `summary` の
 * 一部のみのため、その範囲だけを表現する。
 *
 * `summary` のキー例: `isbn, title, volume, series, publisher, pubdate, cover, author`
 */
export interface OpenBdResponse {
  readonly summary?: {
    readonly isbn?: string;
    readonly title?: string;
    readonly author?: string;
    readonly publisher?: string;
    readonly cover?: string;
  };
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/**
 * OpenBD レスポンスの 1 要素（オブジェクト）を DTO に変換する。
 * `summary` が無い・不正な場合は summary 未設定の DTO を返す。
 */
export function openBdResponseFromJson(
  json: Record<string, unknown>,
): OpenBdResponse {
  const rawSummary = json.summary;
  if (rawSummary === null || typeof rawSummary !== 'object') {
    return {};
  }
  const summary = rawSummary as Record<string, unknown>;
  return {
    summary: {
      isbn: optionalString(summary.isbn),
      title: optionalString(summary.title),
      author: optionalString(summary.author),
      publisher: optionalString(summary.publisher),
      cover: optionalString(summary.cover),
    },
  };
}
