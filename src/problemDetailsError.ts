import {HttpError} from './httpError';

export class ProblemDetailsError extends HttpError {
  constructor({detail, type, instance, status, title}) {
    super(detail, status);
    this.detail = detail;
    this.type = type;
    this.instance = instance;
    this.title = title;
  }
}
