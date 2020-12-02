import {HttpError} from './httpError';

export class ServerError extends HttpError {
  constructor(message) {
    super(message, 400);
  }
}
