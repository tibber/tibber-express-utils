export class HttpResult {
  constructor(statusCode, payload, headers) {
    this.statusCode = statusCode;
    this.payload = payload;
    this.headers = headers;
  }
}
