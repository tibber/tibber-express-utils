import {HttpError} from './HttpError';

export type ProblemDetailsArgs = {
  detail: string;
  instance: string;
  statusCode: number;
  title: string;
  type: string;
};

export class ProblemDetailsError extends HttpError {
  public detail: string;
  public type: string;
  public instance: string;
  public title: string;

  constructor(args: ProblemDetailsArgs) {
    const {detail, instance, statusCode, title, type} = args;

    super(detail, statusCode);

    this.detail = detail;
    this.type = type;
    this.instance = instance;
    this.title = title;
  }
}
