import {HttpError} from './HttpError';

export class ServerError extends HttpError {
  constructor(message: string) {
    super(message, 400);
  }
}
