import {HttpError} from './httpError';

export class NotAuthorizedError extends HttpError {
  constructor(message: string) {
    super(message, 401);
  }
}
