import { Context } from './context';
import { Port } from './port';

export type AdapterFunctionWithNoDependencies<T> = () => T;

export type AdapterFunction<ExistingPorts extends Port, Type> = (
  context: Context<ExistingPorts>,
) => Type;

/** Declare a port adapter. Mainly a helper function to properly type a adapter function for a port. */
export function Adapter<
  TPort extends Port extends Port<infer U, infer Y> ? Port<U, Y> : never,
>(args: {
  port: TPort;
  requires?: [];
  build: AdapterFunctionWithNoDependencies<TPort['_type']>;
}): AdapterFunctionWithNoDependencies<TPort['_type']>;

export function Adapter<
  TPort extends Port extends Port<infer U, infer Y> ? Port<U, Y> : never,
  TDependencies extends Port extends Port<infer U, infer Y>
    ? Port<U, Y>
    : never,
  // eslint-disable-next-line @typescript-eslint/unified-signatures
>(args: {
  port: TPort;
  requires: TDependencies[];
  build: AdapterFunction<TDependencies, TPort['_type']>;
}): AdapterFunction<TDependencies, TPort['_type']>;

export function Adapter(args: {
  port: unknown;
  requires?: unknown[];
  build: unknown;
}) {
  return args.build;
}
