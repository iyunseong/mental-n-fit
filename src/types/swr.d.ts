declare module 'swr' {
  // minimal surface for runtime-only usage
  export const mutate: (key: unknown, data?: unknown, opts?: unknown) => Promise<unknown>
}


