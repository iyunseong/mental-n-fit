// src/lib/swrKeys.ts
// SWR 키 규약: 기간 의존 데이터는 반드시 from/to(ISO)를 포함
export const swrKeys = {
  // KPI(기간형)
  kpi: (fromISO: string, toISO: string) => ['kpi', fromISO, toISO] as const,

  // 일자 단위 요약(사이드바 등)
  summary: (dateISO: string) => ['summary', dateISO] as const,

  // 미션
  missions: (dateISO: string) => ['missions', dateISO] as const,

  // 최근 항목(종류별)
  recent: (kind: string) => ['recent', kind] as const,

  // 트렌드(뷰 기반): kind ∈ 'inbody' | 'workout' | 'meal' | 'condition'
  trend: (kind: string, fromISO: string, toISO: string) => ['trend', kind, fromISO, toISO] as const,
}
