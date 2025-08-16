export type Updater<T = unknown> = (current: T | undefined) => T | Promise<T>
export type SWRKey = string | readonly unknown[] | null

export async function safeMutate<T = unknown>(
  key: SWRKey,
  data?: T | Updater<T>,
  opts?: { revalidate?: boolean }
): Promise<unknown | void> {
  try {
    const mod: unknown = await import('swr')
    const mutateMaybe = typeof mod === 'object' && mod !== null
      ? (mod as Record<string, unknown>)['mutate']
      : undefined
    if (typeof mutateMaybe !== 'function') return
    type MutateFn = (key: SWRKey, data?: unknown | Updater, opts?: { revalidate?: boolean } | boolean) => Promise<unknown>
    const mutate = mutateMaybe as MutateFn

    // SWR v2: options 객체 사용 (e.g., { revalidate: true })
    if (opts && typeof opts === 'object') {
      return await mutate(key, data, opts)
    }
    // SWR v1: 세 번째 인자로 boolean revalidate 전달
    return await mutate(key, data, false)
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[safeMutate] SWR not available, skipped.', e)
    }
  }
}


