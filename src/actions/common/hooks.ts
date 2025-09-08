export async function afterLogSave(userId: string, dateISO: string, kind: 'meal' | 'workout' | 'condition' | 'body', payload?: unknown): Promise<void> {
  // 서버 액션 후크: 현재는 no-op. 필요시 알림/포인트 적립/로그 저장 등 확장.
  return
}



