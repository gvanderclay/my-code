# Hexagonal-DI

A dependency injection library based on the ports and adapters model from hexagonal architecture. It aims to simplify the management of dependencies in your project, making it more maintainable and testable.

## Table of Contents

1. [Components](#components)
   1. [Ports](#ports)
   2. [Adapters](#adapters)
   3. [Context Recipes](#context-recipes)
   4. [Contexts](#contexts)
2. [Usage Example](#usage-example)

## Components

### Ports

Ports represent the interface between your application and its dependencies. You can create a new port using the `Port` function:

```typescript
const myPort = Port<MyID, MyType>('my-id');
```

### Adapters

Adapters are functions that build instances of a port's type. You can declare an adapter using the `Adapter` function:

```typescript
const myAdapter = Adapter({
  port: myPort,
  requires: [dependencyPort],
  build: (context) => new MyType(context.get(dependencyPort)),
});
```

The `requires` property in the adapter is an optional array of ports that the adapter depends on. If `requires` is undefined or an empty array, the adapter has no dependencies, and the `build` function will not take a context as an argument.

The `build` property in the adapter is a function that returns an instance of the port's type. If the adapter has dependencies (specified in the `requires` property), the function takes a context as an argument, which can be used to get instances of the required ports. If the adapter has no dependencies, the function does not take any arguments.

### Context Recipes

Context recipes define the relationship between ports and adapters. They are created using the `ContextRecipe` class. You can build a context recipe by chaining `addPort` calls:

```typescript
const myRecipe = ContextRecipe.init((recipe) => recipe.addPort(myPort, myAdapter));
```

The `addPort` method takes two arguments: the port and the adapter associated with it. The adapter can have dependencies on other ports, which should be specified in the `requires` property when declaring the adapter.

When adding an adapter to a recipe using `addPort`, the method checks if all the dependencies specified in the adapter's `requires` array have already been added to the recipe. If any dependency is missing, an error will be thrown. This ensures that all dependencies are properly managed by the recipe.

You can also merge multiple recipes using the `mergeRecipes` function:

```typescript
const mergedRecipe = mergeRecipes(recipe1, recipe2);
```

### Contexts

Contexts manage the instances of your ports and their dependencies. They are created using the `ContextClassFromRecipe` function:

```typescript
const MyContext = ContextClassFromRecipe(myRecipe);
const context = new MyContext();
```

You can then use the context to get instances of your ports:

```typescript
const myInstance = context.get(myPort);
```

The `get` method on a context takes a port as an argument and returns an instance of the port's type. If the instance has not been created yet, the context will use the associated adapter to build the instance, resolving any dependencies as needed. If the instance has already been created, the context will return the existing instance.
