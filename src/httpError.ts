import ExtendableError from 'es6-error';

export class HttpError extends ExtendableError {
  constructor(message, statusCode) {
    super(message);
    this.httpStatus = statusCode;
  }
}
