export type SupabaseErrorLike = {
  code?: string
  message?: string
  details?: string
  hint?: string
}

export function logSbError(context: string, error: SupabaseErrorLike | unknown) {
  const e = (error as SupabaseErrorLike) || {}
  console.error(context, {
    code: e?.code,
    message: e?.message,
    details: e?.details,
    hint: e?.hint,
  })
}


