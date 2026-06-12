import { describe, expect, test } from 'vitest';

import {
  bookSystemStatusFromJson,
  checkResponseFromJson,
} from '@/data/models/checkResponse';

describe('CheckResponse', () => {
  test('parses complete response with continue=0', () => {
    const json = {
      session: 'abc123',
      continue: 0,
      books: {
        '9784774142230': {
          Tokyo_Minato: {
            status: 'OK',
            reserveurl: 'https://example.com/reserve',
            libkey: {
              みなと: '貸出可',
              三田: '貸出中',
            },
          },
        },
      },
    };

    const response = checkResponseFromJson(json);

    expect(response.session).toBe('abc123');
    expect(response.continueFlag).toBe(0);
    expect(Object.keys(response.books)).toHaveLength(1);

    const bookStatus = response.books['9784774142230']!.Tokyo_Minato!;
    expect(bookStatus.status).toBe('OK');
    expect(bookStatus.reserveUrl).toBe('https://example.com/reserve');
    expect(bookStatus.libKeys).toEqual({ みなと: '貸出可', 三田: '貸出中' });
  });
});

describe('BookSystemStatus', () => {
  test('parses from JSON with reserveurl', () => {
    const json = {
      status: 'OK',
      reserveurl: 'https://example.com/reserve',
      libkey: { みなと: '貸出可' },
    };

    const status = bookSystemStatusFromJson(json);

    expect(status.status).toBe('OK');
    expect(status.reserveUrl).toBe('https://example.com/reserve');
    expect(status.libKeys).toEqual({ みなと: '貸出可' });
  });

  test('parses empty string reserveurl as null', () => {
    const json = {
      status: 'OK',
      reserveurl: '',
      libkey: { みなと: '貸出可' },
    };

    const status = bookSystemStatusFromJson(json);

    expect(status.reserveUrl).toBeUndefined();
  });
});
