import { AdapterFunction, AdapterFunctionWithNoDependencies } from './adapter';
import { Port } from './port';

export type RecipeBuilder<ExistingPorts extends Port> = {
  addPort: <NewPort extends Port>(
    port: NewPort,
    adapter: AdapterFunction<ExistingPorts, NewPort['_type']>,
  ) => RecipeBuilder<ExistingPorts | NewPort>;
  toRecipe: () => Recipe<ExistingPorts>;
};

export type RecipeBuilderInit = {
  addPort: <NewPort extends Port>(
    port: NewPort,
    adapter: AdapterFunctionWithNoDependencies<NewPort['_type']>,
  ) => RecipeBuilder<NewPort>;
};

export type Recipe<ExistingPorts extends Port> = {
  adapters: Map<
    ExistingPorts,
    AdapterFunction<ExistingPorts, ExistingPorts['_type']>
  >;
};

export type CapabilitiesOfRecipe<T extends Recipe<Port>> = T extends Recipe<
  infer U
>
  ? U
  : never;

class RecipeBuilderImpl<ExistingPorts extends Port>
  implements RecipeBuilder<ExistingPorts>
{
  adapters = new Map<
    ExistingPorts,
    AdapterFunction<ExistingPorts, ExistingPorts['_type']>
  >();

  addPort<NewPort extends Port>(
    port: NewPort,
    adapter: AdapterFunction<ExistingPorts, NewPort['_type']>,
  ): RecipeBuilder<ExistingPorts | NewPort> {
    this.addPortToAdapters(port, adapter);
    return this as RecipeBuilder<ExistingPorts | NewPort>;
  }

  private addPortToAdapters<NewPort extends Port>(
    port: NewPort,
    adapter: AdapterFunction<ExistingPorts, NewPort['_type']>,
  ) {
    this.adapters.set(port as unknown as ExistingPorts, adapter);
  }

  toRecipe(): Recipe<ExistingPorts> {
    return {
      adapters: this.adapters,
    };
  }
}

export class ContextRecipe<ExistingPorts extends Port>
  implements Recipe<ExistingPorts>
{
  private adapterMap: Map<
    ExistingPorts,
    AdapterFunction<ExistingPorts, ExistingPorts['_type']>
  >;
  private constructor() {
    this.adapterMap = new Map();
  }

  public static init<TPort extends Port>(
    fn: (recipe: RecipeBuilderInit) => RecipeBuilder<TPort>,
  ): Recipe<TPort> {
    const initialRecipeBuilder =
      new RecipeBuilderImpl<Port>() as RecipeBuilderInit;
    const builder = fn(initialRecipeBuilder);
    return builder.toRecipe();
  }

  get adapters(): Map<
    ExistingPorts,
    AdapterFunction<ExistingPorts, ExistingPorts['_type']>
  > {
    return this.adapterMap;
  }
}

/**
 * Merges two recipes into one
 * arguments later in the list will override the previous ones
 */
export function mergeRecipes<
  Ports1 extends Port,
  Ports2 extends Port,
  Ports extends Ports1 | Ports2 = Ports1 | Ports2,
>(recipe1: Recipe<Ports1>, recipe2: Recipe<Ports2>): Recipe<Ports> {
  const adapterMap = new Map<Ports, AdapterFunction<Ports, Ports['_type']>>();
  const recipes: Recipe<Ports>[] = [
    recipe1,
    recipe2,
  ] as unknown as Recipe<Ports>[];
  for (const recipe of recipes) {
    for (const [port, adapter] of recipe.adapters.entries()) {
      adapterMap.set(port, adapter);
    }
  }
  return {
    adapters: adapterMap,
  };
}
