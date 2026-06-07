/**
 * Models for the Calil `/check` API response.
 * Mirrors the Dart `CheckResponse` / `BookSystemStatus`.
 *
 * The Calil API uses lowercase snake-case keys:
 * `session, continue, books, status, reserveurl, libkey`.
 */

export interface BookSystemStatus {
  readonly status: string;
  readonly reserveUrl?: string;
  readonly libKeys: Record<string, string>;
}

export interface CheckResponse {
  readonly session: string;
  readonly continueFlag: number;
  readonly books: Record<string, Record<string, BookSystemStatus>>;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function bookSystemStatusFromJson(
  json: Record<string, unknown>,
): BookSystemStatus {
  const status = typeof json.status === 'string' ? json.status : '';

  const rawReserveUrl = json.reserveurl;
  const reserveUrl =
    typeof rawReserveUrl === 'string' && rawReserveUrl.length > 0
      ? rawReserveUrl
      : undefined;

  const libKeysJson = asRecord(json.libkey);
  const libKeys: Record<string, string> = {};
  for (const [key, value] of Object.entries(libKeysJson)) {
    libKeys[key] = typeof value === 'string' ? value : '';
  }

  return { status, reserveUrl, libKeys };
}

export function checkResponseFromJson(
  json: Record<string, unknown>,
): CheckResponse {
  const session = typeof json.session === 'string' ? json.session : '';
  const continueFlag = typeof json.continue === 'number' ? json.continue : 0;

  const booksJson = asRecord(json.books);
  const books: Record<string, Record<string, BookSystemStatus>> = {};
  for (const [isbn, systemsValue] of Object.entries(booksJson)) {
    const systemsJson = asRecord(systemsValue);
    const systems: Record<string, BookSystemStatus> = {};
    for (const [systemId, statusValue] of Object.entries(systemsJson)) {
      systems[systemId] = bookSystemStatusFromJson(asRecord(statusValue));
    }
    books[isbn] = systems;
  }

  return { session, continueFlag, books };
}
