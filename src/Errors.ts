import {BadRequestError} from './BadRequestError';
import {ConflictError} from './ConflictError';
import {HttpError} from './HttpError';
import {NotAuthorizedError} from './NotAuthorizedError';
import {NotFoundError} from './NotFoundError';
import {ProblemDetailsArgs, ProblemDetailsError} from './ProblemDetailsError';
import {ServerError} from './ServerError';

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
