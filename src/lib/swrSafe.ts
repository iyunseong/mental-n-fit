export async function safeMutate(key: any, data?: any, revalidate?: boolean) {
  try {
    const mod = await import('swr')
    // mutate(key, data, revalidate)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await (mod as any).mutate(key, data, revalidate)
  } catch {
    // SWR 미설치 시 무시
  }
}


