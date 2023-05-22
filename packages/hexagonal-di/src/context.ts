import { Port } from './port';
import { Recipe } from './recipe';

export type Context<TPort extends Port> = {
  _needs: { [K in TPort['id']]: K };
  get<TP extends TPort>(port: TP): TP['_type'];
  /** TODO: Factor out a container type that the context has a reference to instead of including this on the context itself */
  __override<TP extends TPort>(port: TP, value?: TP['_type']): void;
};

type ContextClass<TCapabilities extends Port> = new (
  recipeOverrides?: Recipe<TCapabilities>,
) => Context<TCapabilities>;

export const ContextClassFromRecipe = <ExistingPorts extends Port>(
  recipe: Recipe<ExistingPorts>,
): ContextClass<ExistingPorts> => {
  class ContextClass implements Context<ExistingPorts> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    _needs = null as unknown as { [K in ExistingPorts['id']]: K };
    private instances = new Map<ExistingPorts, ExistingPorts['_type']>();
    private recipe: Recipe<ExistingPorts> = recipe;
    constructor(recipeOverrides?: Recipe<ExistingPorts>) {
      if (recipeOverrides) {
        for (const [portId, adapter] of recipeOverrides.adapters.entries()) {
          if (this.recipe.adapters.has(portId)) {
            this.recipe.adapters.set(portId, adapter);
          }
        }
      }
    }

    public get<TPort extends ExistingPorts>(port: TPort): TPort['_type'] {
      const instance = this.instances.get(port) as TPort['_type'];
      if (instance) {
        return instance;
      }

      const adapter = this.recipe.adapters.get(port);
      if (!adapter) {
        throw new Error(`
      No adapter found for port with id: ${port.id}
      Available ports: ${[...this.recipe.adapters.keys()]
        .map((x) => x.id)
        .join(', ')}`);
      }

      const newInstance = adapter(this as unknown as Context<ExistingPorts>);
      this.instances.set(port, newInstance);
      return newInstance;
    }

    __override<TPort extends ExistingPorts>(
      port: TPort,
      value?: TPort['_type'],
    ): void {
      if (value === undefined) {
        this.instances.delete(port);
      }
      this.instances.set(port, value);
    }
  }
  return ContextClass;
};
