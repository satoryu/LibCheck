/**
 * Base exception for all Calil API related errors.
 * Mirrors the Dart `CalilApiException` hierarchy.
 */
export class CalilApiException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CalilApiException';
    // Restore prototype chain for reliable `instanceof` checks after transpile.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class CalilNetworkException extends CalilApiException {
  constructor(message: string) {
    super(message);
    this.name = 'CalilNetworkException';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class CalilHttpException extends CalilApiException {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'CalilHttpException';
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class CalilParseException extends CalilApiException {
  constructor(message: string) {
    super(message);
    this.name = 'CalilParseException';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class CalilTimeoutException extends CalilApiException {
  constructor(message: string) {
    super(message);
    this.name = 'CalilTimeoutException';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
