# Blueprints

Blueprints is a TypeScript library that provides a flexible way to create customizable object instances, making it easier to generate test data or construct objects with predefined designs. It allows you to define blueprints for your objects and build them with optional transformations and overrides.

## Features

- **Define object blueprints** with default values or factory functions.
- **Asynchronous support** for dynamic value generation.
- **Build multiple instances** of objects efficiently.
- **Transform objects** during construction.

## Usage

### Defining a Blueprint

Start by importing the `design` function and defining a blueprint for your object:

```typescript
import { design } from 'blueprints';

interface User {
  id: number;
  name: string;
  email: string;
}

const userBlueprint = design<User>({
  id: () => Math.floor(Math.random() * 1000),
  name: 'John Doe',
  email: async () => {
    // Simulate asynchronous operation
    return 'john.doe@example.com';
  },
});
```

In the blueprint above:

- `id` is generated using a function.
- `name` is a static value.
- `email` is generated using an asynchronous function.

### Building an Instance

Build an instance of the object using the `build` method:

```typescript
const user = await userBlueprint.build();
console.log(user);
// Output might be: { id: 123, name: 'John Doe', email: 'john.doe@example.com' }
```

### Overriding Values

You can override default values during the build:

```typescript
const customUser = await userBlueprint.build({ name: 'Jane Smith' });
console.log(customUser);
// Output might be: { id: 456, name: 'Jane Smith', email: 'john.doe@example.com' }
```

### Building Multiple Instances

Use the `buildMany` method to create multiple instances:

```typescript
const users = await userBlueprint.buildMany(5);
console.log(users.length); // Output: 5
```

### Transforming Built Objects

Apply a transformation function during the build process:

```typescript
const transformedUserBlueprint = design<User, string>(
  {
    id: () => Math.floor(Math.random() * 1000),
    name: 'John Doe',
    email: 'john.doe@example.com',
  },
  (user) => `${user.name} <${user.email}>`,
);

const userString = await transformedUserBlueprint.build();
console.log(userString);
// Output: 'John Doe <john.doe@example.com>'
```

## API Reference

### `design<TInput, Transformed>(blueprintDesign, transform?)`

Creates a blueprint for building objects.

- `blueprintDesign`: An object where each key corresponds to a property of `TInput` and the value is a static value, a function, or a promise that resolves to the property's value.
- `transform`: (Optional) A function that transforms the built object before it's returned.

Returns a `Blueprint` object with `build` and `buildMany` methods.

### `Blueprint.build(overrides?)`

Builds a single instance of the blueprint.

- `overrides`: (Optional) An object to override default values in the blueprint.

Returns a promise that resolves to the built and optionally transformed object.

### `Blueprint.buildMany(count, overrides?)`

Builds multiple instances of the blueprint.

- `count`: Number of instances to build.
- `overrides`: (Optional) An object to override default values in each instance.

Returns a promise that resolves to an array of built objects.
