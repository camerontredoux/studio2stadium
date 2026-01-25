export type ReadonlyNonEmptyArray<A> = ReadonlyArray<A> & {
  readonly 0: A;
};
