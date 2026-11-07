import {Request, Router} from 'express';

export type DeprecationOptions = {
  /** Sent as the RFC 9745 `Deprecation` header. */
  deprecationDate: string;
  /** Sent as a `Link` header with `rel="successor-version"`. */
  successorRoute?: string;
  /** Sent as the RFC 8594 `Sunset` header. */
  sunsetDate?: string;
  /**
   * Called on every request to the route. `caller` is the `x-tibber-caller`
   * header, else `User-Agent`, else `'unknown'`.
   */
  onCall: (
    call: {caller: string; method: string; route: string; sunsetDate?: string},
    req: Request
  ) => void;
};

/**
 * Marks `route` and every path under it as deprecated. It is mounted with
 * `router.use`, so register it before the route's handler. Dates are parsed with
 * `new Date()`, and an invalid one throws here, at startup.
 */
export const registerDeprecated = (
  router: Router,
  route: string,
  {deprecationDate, onCall, successorRoute, sunsetDate}: DeprecationOptions
) => {
  const headers = {
    Deprecation: `@${Math.floor(parseDate(deprecationDate).getTime() / 1000)}`,
    ...(sunsetDate && {Sunset: parseDate(sunsetDate).toUTCString()}),
  };

  router.use(route, (req, res, next) => {
    const caller =
      req.get('x-tibber-caller') ?? req.get('user-agent') ?? 'unknown';
    onCall({caller, method: req.method, route, sunsetDate}, req);
    res.set(headers);
    if (successorRoute) {
      res.links({'successor-version': successorRoute});
    }
    next();
  });
};

const parseDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid deprecation date: ${value}`);
  }
  return date;
};
