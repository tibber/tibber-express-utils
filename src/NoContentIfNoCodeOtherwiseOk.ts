export const NoContentIfNoCodeOtherwiseOk = (
  code: undefined | number | unknown
) => (code ? 202 : 204);
