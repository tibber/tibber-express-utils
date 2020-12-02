import {HttpError} from './httpError';

export class ServerError extends HttpError {
  constructor(message: string) {
    super(message, 400);
  }
}
