import {HttpError} from './httpError';

export class NotFoundError extends HttpError {
  constructor(message) {
    super(message, 404);
  }
}
