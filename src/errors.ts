import {BadRequestError} from './badRequestError';
import {ConflictError} from './conflictError';
import {HttpError} from './httpError';
import {NotAuthorizedError} from './notAuthorizedError';
import {NotFoundError} from './notFoundError';
import {ProblemDetailsArgs, ProblemDetailsError} from './problemDetailsError';
import {ServerError} from './serverError';

export class Errors {
  static badRequestError(message: string) {
    return new BadRequestError(message);
  }

  static serverError(message: string) {
    return new ServerError(message);
  }

  static notAuthorizedError(message: string) {
    return new NotAuthorizedError(message);
  }

  static notFoundError(message: string) {
    return new NotFoundError(message);
  }

  static conflictError(message: string) {
    return new ConflictError(message);
  }

  static httpError(message: string, statusCode: number) {
    return new HttpError(message, statusCode);
  }

  static problemDetailsError(payload: ProblemDetailsArgs) {
    return new ProblemDetailsError(payload);
  }
}
