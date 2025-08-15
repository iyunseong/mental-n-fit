export const swrKeys = {
  kpiToday: ['kpi', 'today'] as const,
  summary: (date: string) => ['summary', date] as const,
  missions: (date: string) => ['missions', date] as const,
  recent: (kind: string) => ['recent', kind] as const,
}


