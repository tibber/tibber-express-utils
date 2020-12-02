import {HttpError} from './httpError';

export class NotAuthorizedError extends HttpError {
  constructor(message) {
    super(message, 401);
  }
}
