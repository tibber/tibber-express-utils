import {HttpError} from './httpError';

export class ConflictError extends HttpError {
  constructor(message: string) {
    super(message, 409);
  }
}
