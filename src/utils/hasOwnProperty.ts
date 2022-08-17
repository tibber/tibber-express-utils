/**
 * Guard for determining types that contain a certain property, inferring the existence
 * of the property if truthy.
 *
 * @param target
 * @param propertyKey
 */
export const hasOwnProperty = <
  TTarget extends {},
  TPropertyKey extends PropertyKey
>(
  target: TTarget,
  propertyKey: TPropertyKey
): target is Record<TPropertyKey, unknown> & TTarget => {
  return Object.prototype.hasOwnProperty.call(target, propertyKey);
};
