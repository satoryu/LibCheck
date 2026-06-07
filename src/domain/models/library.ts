export interface Library {
  readonly systemId: string;
  readonly systemName: string;
  readonly libKey: string;
  readonly libId: string;
  readonly shortName: string;
  readonly formalName: string;
  readonly address: string;
  readonly pref: string;
  readonly city: string;
  readonly category: string;
  readonly url?: string;
  readonly tel?: string;
  readonly geocode?: string;
}

function requireString(json: Record<string, unknown>, key: string): string {
  const value = json[key];
  if (typeof value !== 'string') {
    throw new Error(`Library.fromJson: missing or invalid required string "${key}"`);
  }
  return value;
}

function optionalString(json: Record<string, unknown>, key: string): string | undefined {
  const value = json[key];
  if (value === null || value === undefined) return undefined;
  if (typeof value !== 'string') {
    throw new Error(`Library.fromJson: invalid optional string "${key}"`);
  }
  return value;
}

export function libraryFromJson(json: Record<string, unknown>): Library {
  return {
    systemId: requireString(json, 'systemId'),
    systemName: requireString(json, 'systemName'),
    libKey: requireString(json, 'libKey'),
    libId: requireString(json, 'libId'),
    shortName: requireString(json, 'shortName'),
    formalName: requireString(json, 'formalName'),
    address: requireString(json, 'address'),
    pref: requireString(json, 'pref'),
    city: requireString(json, 'city'),
    category: requireString(json, 'category'),
    url: optionalString(json, 'url'),
    tel: optionalString(json, 'tel'),
    geocode: optionalString(json, 'geocode'),
  };
}

export function libraryToJson(lib: Library): Record<string, unknown> {
  return {
    systemId: lib.systemId,
    systemName: lib.systemName,
    libKey: lib.libKey,
    libId: lib.libId,
    shortName: lib.shortName,
    formalName: lib.formalName,
    address: lib.address,
    pref: lib.pref,
    city: lib.city,
    category: lib.category,
    url: lib.url ?? null,
    tel: lib.tel ?? null,
    geocode: lib.geocode ?? null,
  };
}

export function librariesEqual(a: Library, b: Library): boolean {
  return a.systemId === b.systemId && a.libKey === b.libKey && a.libId === b.libId;
}

export function libraryKey(lib: Library): string {
  return `${lib.systemId}|${lib.libKey}|${lib.libId}`;
}
