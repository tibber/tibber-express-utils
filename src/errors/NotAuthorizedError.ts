import {HttpError} from './HttpError';

export class NotAuthorizedError extends HttpError {
  constructor(message: string) {
    super(message, 401);
  }
}
