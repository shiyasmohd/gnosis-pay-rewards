export type ConditionalReturnType<T extends boolean, A, B> = T extends true
  ? { data: A; error: null }
  : { data: null; error: B };
