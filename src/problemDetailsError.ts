import {HttpError} from './httpError';

export type ProblemDetailsArgs = {
  detail: string;
  type: string;
  instance: string;
  statusCode: number;
  title: string;
};

export class ProblemDetailsError extends HttpError {
  public detail: string;
  public type: string;
  public instance: string;
  public title: string;

  constructor(args: ProblemDetailsArgs) {
    const {detail, type, instance, statusCode, title} = args;

    super(detail, statusCode);

    this.detail = detail;
    this.type = type;
    this.instance = instance;
    this.title = title;
  }
}
