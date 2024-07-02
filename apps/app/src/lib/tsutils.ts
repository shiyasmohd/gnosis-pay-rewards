// Disable eslint for this file because it's not a component
// Disable ts-check for this file because it's not a component
/* eslint-disable */
// @ts-nocheck

/**
 * Source: https://stackoverflow.com/a/65015868/2151050
 */

export type CamelCase<S extends string> = S extends `${infer P1}_${infer P2}${infer P3}`
  ? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}`
  : Lowercase<S>;

export type KeysToCamelCase<T> = {
  [K in keyof T as CamelCase<string & K>]: T[K] extends {} ? KeysToCamelCase<T[K]> : T[K];
};
