import {HttpError} from './httpError';

export class BadRequestError extends HttpError {
  constructor(message) {
    super(message, 400);
  }
}
