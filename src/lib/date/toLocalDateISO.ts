// 로컬 타임존 기준 YYYY-MM-DD (UTC 변환 없이)
export function toLocalDateISO(d = new Date()): string {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${y}-${pad(m)}-${pad(day)}`;
}

// Date -> YYYY-MM-DD (로컬) 헬퍼 (캘린더에서 사용)
export const toDateKey = (d: Date) => toLocalDateISO(d);
