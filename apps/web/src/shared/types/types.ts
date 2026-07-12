/**
 * Representing deep read-only utilities.
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

/**
 * Primitive JSON types.
 */
export type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];
