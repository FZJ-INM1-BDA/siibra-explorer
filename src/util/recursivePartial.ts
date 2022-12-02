export type RecursivePartial<T> = Partial<{
  [K in keyof T]: RecursivePartial<T[K]>
}>
