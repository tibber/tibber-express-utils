import {HttpError} from './HttpError';

export type ProblemDetailsArgs = {
  detail?: string;
  instance?: string;
  statusCode: number;
  title: string;
  type: string;
  extensions?: {
    [k: string]: unknown;
  };
};

export class ProblemDetailsError extends HttpError {
  public type: string;
  public title: string;
  public detail?: string;
  public instance?: string;
  public extensions?: {
    [k: string]: unknown;
  };

  constructor(args: ProblemDetailsArgs) {
    const {detail, instance, statusCode, title, type, extensions} = args;

    super(detail ?? title, statusCode);

    this.detail = detail;
    this.type = type;
    this.instance = instance;
    this.title = title;
    this.extensions = extensions ?? {};
  }
}
