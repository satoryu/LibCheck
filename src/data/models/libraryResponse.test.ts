import { describe, expect, test } from 'vitest';

import { libraryResponseFromJson } from '@/data/models/libraryResponse';

describe('LibraryResponse', () => {
  test('parses from JSON correctly', () => {
    const json = {
      systemid: 'Tokyo_Minato',
      systemname: '港区図書館',
      libkey: 'みなと',
      libid: '123456',
      short: 'みなと図書館',
      formal: '港区立みなと図書館',
      url_pc: 'https://example.com',
      address: '東京都港区芝公園3-2-25',
      pref: '東京都',
      city: '港区',
      post: '105-0011',
      tel: '03-1234-5678',
      geocode: '139.7454,35.6586',
      category: 'MEDIUM',
    };

    const response = libraryResponseFromJson(json);

    expect(response.systemId).toBe('Tokyo_Minato');
    expect(response.systemName).toBe('港区図書館');
    expect(response.libKey).toBe('みなと');
    expect(response.libId).toBe('123456');
    expect(response.shortName).toBe('みなと図書館');
    expect(response.formalName).toBe('港区立みなと図書館');
    expect(response.urlPc).toBe('https://example.com');
    expect(response.address).toBe('東京都港区芝公園3-2-25');
    expect(response.pref).toBe('東京都');
    expect(response.city).toBe('港区');
    expect(response.post).toBe('105-0011');
    expect(response.tel).toBe('03-1234-5678');
    expect(response.geocode).toBe('139.7454,35.6586');
    expect(response.category).toBe('MEDIUM');
  });
});
