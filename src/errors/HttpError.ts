import ExtendableError from 'es6-error';

export class HttpError extends ExtendableError {
  constructor(message: string, public httpStatus: number) {
    super(message);
  }
}
