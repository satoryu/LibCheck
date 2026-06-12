/**
 * Model for the Calil `/library` API response entry.
 * Mirrors the Dart `LibraryResponse`.
 *
 * The Calil API uses lowercase snake-case keys:
 * `systemid, systemname, libkey, libid, short, formal, url_pc,
 *  address, pref, city, post, tel, geocode, category`.
 */
export interface LibraryResponse {
  readonly systemId: string;
  readonly systemName: string;
  readonly libKey: string;
  readonly libId: string;
  readonly shortName: string;
  readonly formalName: string;
  readonly urlPc?: string;
  readonly address: string;
  readonly pref: string;
  readonly city: string;
  readonly post?: string;
  readonly tel?: string;
  readonly geocode?: string;
  readonly category: string;
}

function stringOrDefault(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export function libraryResponseFromJson(
  json: Record<string, unknown>,
): LibraryResponse {
  return {
    systemId: stringOrDefault(json.systemid),
    systemName: stringOrDefault(json.systemname),
    libKey: stringOrDefault(json.libkey),
    libId: stringOrDefault(json.libid),
    shortName: stringOrDefault(json.short),
    formalName: stringOrDefault(json.formal),
    urlPc: optionalString(json.url_pc),
    address: stringOrDefault(json.address),
    pref: stringOrDefault(json.pref),
    city: stringOrDefault(json.city),
    post: optionalString(json.post),
    tel: optionalString(json.tel),
    geocode: optionalString(json.geocode),
    category: stringOrDefault(json.category),
  };
}
