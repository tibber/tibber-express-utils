export const NotFoundIfNoCodeOtherwiseOk = (code: undefined | number) =>
  code === undefined ? 404 : 200;
