type DesignFn<T extends object, P extends keyof T = keyof T> = () =>
  | PromiseLike<T[P]>
  | T[P];

type BlueprintDesignValue<T extends object, P extends keyof T = keyof T> =
  | T[P]
  | Promise<T[P]>
  | DesignFn<T, P>;

export type BlueprintDesign<T extends object> = {
  [P in keyof T]: BlueprintDesignValue<T>;
};

export type Blueprint<
  TInput extends object,
  Transformed extends object = TInput,
> = {
  build: (overrides?: Partial<TInput>) => Promise<Transformed>;
  buildMany: (
    count: number,
    overrides?: Partial<TInput>,
  ) => Promise<Transformed[]>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const identity = (x: any) => x;

export const design = <
  TInput extends object,
  Transformed extends object = TInput,
>(
  blueprintDesign: BlueprintDesign<TInput>,
  transform: (
    input: TInput,
    overrides: Partial<TInput>,
  ) => Transformed | Promise<Transformed> = identity,
): Blueprint<TInput, Transformed> => {
  const build = async (overrides = {}) => {
    let result = {} as TInput;
    for (const key in blueprintDesign) {
      const design = blueprintDesign[key];
      if (designIsFn(design)) {
        result = {
          ...result,
          [key]: await design(),
        };
      } else {
        result = {
          ...result,
          [key]: design,
        };
      }
    }
    const withOverrides = Object.assign(result, overrides);
    return transform(withOverrides, overrides);
  };
  const buildMany = async (count: number, overrides = {}) => {
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(await build(overrides));
    }
    return result;
  };
  return {
    build,
    buildMany,
  };
};

const designIsFn = <T extends object>(
  x: BlueprintDesignValue<T>,
): x is DesignFn<T> => {
  return typeof x === 'function';
};
