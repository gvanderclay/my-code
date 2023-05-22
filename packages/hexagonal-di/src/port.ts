export type Port<ID extends string = string, Type = unknown> = {
  id: ID;
  _type: Type;
};

export const Port = <ID extends string, Type>(id: ID): Port<ID, Type> =>
  ({
    id,
  } as Port<ID, Type>);
