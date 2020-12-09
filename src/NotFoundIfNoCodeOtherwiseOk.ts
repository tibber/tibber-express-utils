export const NotFoundIfNoCodeOtherwiseOk = (
  code: undefined | number | unknown
) => (code === undefined ? 404 : 200);
