import {HttpError} from './httpError';

export class ConflictError extends HttpError {
  constructor(message) {
    super(message, 409);
  }
}
