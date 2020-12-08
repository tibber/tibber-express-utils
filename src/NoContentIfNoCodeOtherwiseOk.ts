export const NoContentIfNoCodeOtherwiseOk = (code: undefined | number) =>
  code ? 202 : 204;
