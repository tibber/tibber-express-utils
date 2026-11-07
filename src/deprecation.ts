import {Request, Router} from 'express';

/**
 * One request to a deprecated route. `route` is the template it was registered with, and
 * `caller` is the `x-tibber-caller` header, else the `User-Agent` header, else `'unknown'`.
 */
export type DeprecatedCall = {
  caller: string;
  method: string;
  route: string;
  sunsetDate?: string;
};

/**
 * Dates are anything `new Date()` parses, e.g. `'2026-12-01'`.
 */
export type DeprecationOptions = {
  /** When the route was or will be deprecated. Sent as the RFC 9745 `Deprecation` header. */
  deprecationDate: string;
  /** What callers should use instead. Sent as a `Link` header with `rel="successor-version"`. */
  successorRoute?: string;
  /** When the route stops working. Sent as the RFC 8594 `Sunset` header. */
  sunsetDate?: string;
  /**
   * Called on every request to the route. Record the call in the service's logs or metrics
   * here, so you can tell when nobody calls the route any more.
   */
  onCall: (call: DeprecatedCall, req: Request) => void;
};

/**
 * Marks every route under `routeTemplate` as deprecated: each request gets the `Deprecation`,
 * `Sunset` and `Link` response headers and is passed to `onCall`.
 *
 * `routeTemplate` uses OpenAPI-style parameters (`/homes/{id}`). It is mounted with
 * `router.use`, so register it before the route's handler. The dates are validated here, so a bad
 * date fails at startup.
 */
export const registerDeprecated = (
  router: Router,
  routeTemplate: string,
  {deprecationDate, onCall, successorRoute, sunsetDate}: DeprecationOptions
) => {
  const headers: Record<string, string> = {
    Deprecation: `@${Math.floor(parseDate(deprecationDate).getTime() / 1000)}`,
  };
  if (sunsetDate) {
    headers.Sunset = parseDate(sunsetDate).toUTCString();
  }
  if (successorRoute) {
    headers.Link = `<${successorRoute}>; rel="successor-version"`;
  }

  router.use(toExpressPath(routeTemplate), (req, res, next) => {
    const caller =
      req.get('x-tibber-caller') ?? req.get('user-agent') ?? 'unknown';
    onCall({caller, method: req.method, route: routeTemplate, sunsetDate}, req);
    res.set(headers);
    next();
  });
};

const toExpressPath = (routeTemplate: string) =>
  routeTemplate.replace(/\{(\w+)\}/g, ':$1');

const parseDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid deprecation date: ${value}`);
  }
  return date;
};
