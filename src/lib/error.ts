export function logSbError(context: string, error: any) {
  console.error(context, {
    code: error?.code,
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
  })
}


