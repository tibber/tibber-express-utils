import {BadRequestError} from './badRequestError';
import {ServerError} from './serverError';
import {NotAuthorizedError} from './notAuthorizedError';
import {NotFoundError} from './notFoundError';
import {ConflictError} from './conflictError';
import {HttpError} from './httpError';
import {ProblemDetailsError} from './problemDetailsError';

export class Errors {
  static badRequestError(message) {
    return new BadRequestError(message);
  }

  static serverError(message) {
    return new ServerError(message);
  }

  static notAuthorizedError(message) {
    return new NotAuthorizedError(message);
  }

  static notFoundError(message) {
    return new NotFoundError(message);
  }

  static conflictError(message) {
    return new ConflictError(message);
  }

  static httpError(message, statusCode) {
    return new HttpError(message, statusCode);
  }

  static problemDetailsError(payload) {
    return new ProblemDetailsError(payload);
  }
}
