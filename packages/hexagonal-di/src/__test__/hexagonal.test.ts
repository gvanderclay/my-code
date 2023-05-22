import {
  Port,
  Adapter,
  ContextRecipe,
  Context,
  ContextClassFromRecipe,
  mergeRecipes,
} from '..';

describe('di', () => {
  it('should resolve a class', () => {
    type Engine = {
      start: (name: string) => void;
      name: string;
    };

    type EngineFactory = {
      create: (name: string) => Engine;
    };

    const engineFactoryPort = Port<'EngineFactory', EngineFactory>(
      'EngineFactory',
    );

    type Car = {
      start: (name: string) => void;
    };

    const carPort = Port<'CarPort', Car>('CarPort');

    type Driver = {
      name: string;
      drive: (name: string) => void;
    };

    const driverPort = Port<'Driver', Driver>('Driver');

    const factoryMock = jest.fn();

    const engineAdapter = Adapter({
      port: engineFactoryPort,
      build: () => ({
        create: (name: string) => ({
          start: () => {
            factoryMock(name);
          },
          name,
        }),
      }),
    });

    const recipe = ContextRecipe.init((recipe) => {
      const foo = recipe
        .addPort(engineFactoryPort, engineAdapter)
        .addPort(carPort, (ctx: Context<typeof engineFactoryPort>) => ({
          start: (name: string) => {
            const factory = ctx.get(engineFactoryPort);
            const engine = factory.create(name);
            engine.start(name);
          },
        }))
        .addPort(driverPort, (ctx: Context<typeof carPort>) => ({
          name: 'John',
          drive: (engineName: string) => {
            const car = ctx.get(carPort);
            car.start(engineName);
          },
        }));

      return foo;
    });

    const context = new (ContextClassFromRecipe(recipe))();

    const driver = context.get(driverPort);
    driver.drive('V8');

    expect(factoryMock).toHaveBeenCalledWith('V8');
  });
  it('can lazily instantiate objects', () => {
    const port1 = Port<'Port1', { name: string }>('Port1');
    const port2 = Port<'Port2', { age: number; port1: { name: string } }>(
      'Port2',
    );

    const builtPorts: string[] = [];

    const recipe = ContextRecipe.init((recipe) =>
      recipe
        .addPort(port1, () => {
          builtPorts.push('port1');
          return {
            name: 'John',
          };
        })
        .addPort(port2, (ctx) => {
          builtPorts.push('port2');
          return {
            age: 42,
            port1: ctx.get(port1),
          };
        }),
    );

    const context = new (ContextClassFromRecipe(recipe))();

    expect(builtPorts).toEqual([]);

    context.get(port1);

    expect(builtPorts).toEqual(['port1']);

    context.get(port2);

    expect(builtPorts).toEqual(['port1', 'port2']);

    context.get(port1);
    context.get(port2);
    expect(builtPorts).toEqual(['port1', 'port2']);
  });

  it('can override values in context', () => {
    const port1 = Port<'Port1', { name: string }>('Port1');
    const port2 = Port<'Port2', { name: string }>('Port2');

    const recipe = ContextRecipe.init((recipe) => {
      return recipe
        .addPort(port1, () => ({
          name: 'John',
        }))
        .addPort(port2, (ctx) => {
          return {
            name: ctx.get(port1).name,
          };
        });
    });

    const overrides = ContextRecipe.init((recipe) => {
      return recipe.addPort(port1, () => ({ name: 'jack' }));
    });

    const context = new (ContextClassFromRecipe(recipe))(overrides);

    expect(context.get(port1).name).toEqual('jack');
    expect(context.get(port2).name).toEqual('jack');
  });

  it('when merging recipes, 2nd argument takes priority', () => {
    const port1 = Port<'Port1', { name: string }>('Port1');
    const port2 = Port<'Port2', { name: string }>('Port2');

    const recipe1 = ContextRecipe.init((recipe) => {
      return recipe
        .addPort(port1, () => ({
          name: 'John',
        }))
        .addPort(port2, () => {
          return {
            name: 'Jack',
          };
        });
    });

    const recipe2 = ContextRecipe.init((recipe) => {
      return recipe.addPort(port2, () => {
        return {
          name: 'George',
        };
      });
    });

    const merged = mergeRecipes(recipe1, recipe2);

    const context = new (ContextClassFromRecipe(merged))();

    expect(context.get(port1).name).toEqual('John');
    expect(context.get(port2).name).toEqual('George');
  });
});

// type tests

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function dontRunOnlyForTesting() {
  const fooPort = Port<'Foo', { name: string }>('Foo');
  const booPort = Port<'Boo', { name: string; age: number }>('Boo');
  const bazPort = Port<
    'Baz',
    { name: string; age: number; foo: { name: string } }
  >('Baz');

  Adapter({
    port: fooPort,
    // @ts-expect-error - return type is wrong in build function
    build: () => {
      return { age: 12 };
    },
  });

  const fooAdapter = Adapter({
    port: fooPort,
    build: () => ({
      name: 'John',
    }),
  });

  const booAdapter = Adapter({
    port: booPort,
    requires: [bazPort],
    build: (ctx) => {
      return {
        name: ctx.get(bazPort).name,
        age: 42,
      };
    },
  });

  const bazAdapter = Adapter({
    port: bazPort,
    requires: [fooPort],
    build: (ctx) => {
      // @ts-expect-error - booPort is not in the requires array
      ctx.get(booPort);
      // @ts-expect-error - bazPort is not in the requires array
      ctx.get(bazPort);
      return {
        name: ctx.get(fooPort).name,
        age: 42,
        foo: ctx.get(fooPort),
      };
    },
  });

  ContextRecipe.init((recipe) => {
    // @ts-expect-error - recipe does not yet have fooPort
    return recipe.addPort(bazPort, bazAdapter);
  });

  ContextRecipe.init((recipe) => {
    return recipe.addPort(fooPort, fooAdapter);
  });

  ContextRecipe.init((recipe) => {
    return recipe
      .addPort(fooPort, fooAdapter)
      .addPort(bazPort, bazAdapter)
      .addPort(booPort, booAdapter);
  });

  const recipe = ContextRecipe.init((recipe) => {
    return (
      recipe
        .addPort(fooPort, fooAdapter)
        // @ts-expect-error - booAdapter requires bazPort
        .addPort(booPort, booAdapter)
        .addPort(bazPort, bazAdapter)
    );
  });

  const context = new (ContextClassFromRecipe(recipe))();

  // @ts-expect-error - id asdf is not in the requires array
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const asdf = context.get({ id: 'asdf', type: 'asdf' });
}
