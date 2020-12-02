export class HttpResult<TPayload = any> {
  constructor(
      public statusCode: number,
      public payload: TPayload,
      public headers)
  {
  }
}
