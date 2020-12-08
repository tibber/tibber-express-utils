import {ContextSelector} from '../types';

/**
 * Given a concrete ContextSelector function, infers the type of the context
 * that it selects.
 */
export type ContextOf<
  TContextSelector extends ContextSelector<unknown>
> = TContextSelector extends ContextSelector<infer U> ? U : never;
