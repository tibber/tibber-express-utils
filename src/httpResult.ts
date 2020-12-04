type HttpHeaderValue = string | string[] | undefined;

type HttpHeaders = {
  [key: string]: HttpHeaderValue;
};

export class HttpResult<TPayload = unknown> {
  constructor(
    public statusCode: number,
    public payload: TPayload,
    public headers?: HttpHeaders
  ) {}
}
