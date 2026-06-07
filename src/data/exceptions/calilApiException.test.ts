import { describe, expect, test } from 'vitest';

import {
  CalilApiException,
  CalilHttpException,
  CalilNetworkException,
  CalilParseException,
  CalilTimeoutException,
} from '@/data/exceptions/calilApiException';

describe('CalilApiException hierarchy', () => {
  test('toString includes class name and message', () => {
    const e = new CalilNetworkException('Connection failed');
    expect(e.toString()).toBe('CalilNetworkException: Connection failed');
  });

  test('subclasses are instances of CalilApiException', () => {
    expect(new CalilNetworkException('x')).toBeInstanceOf(CalilApiException);
    expect(new CalilHttpException('x', 500)).toBeInstanceOf(CalilApiException);
    expect(new CalilParseException('x')).toBeInstanceOf(CalilApiException);
    expect(new CalilTimeoutException('x')).toBeInstanceOf(CalilApiException);
  });

  test('CalilHttpException carries the status code', () => {
    const e = new CalilHttpException('boom', 503);
    expect(e.statusCode).toBe(503);
  });
});
