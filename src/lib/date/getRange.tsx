// src/lib/date/getRange.tsx
// Asia/Seoul 기준으로 최근 30/90일 경계(from/to)를 YYYY-MM-DD로 반환
// 차트/쿼리의 일자 WHERE 절에 그대로 쓰기 좋게 맞춤

function toISODateInTZ(d: Date, timeZone: string): string {
    // 'YYYY-MM-DD' 형태
    const fmt = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
    return fmt.format(d) // en-CA는 2025-09-10 형태
  }
  
  function addDaysISO(isoYYYYMMDD: string, days: number): string {
    // UTC 자정 기준으로 안전하게 증감
    const base = new Date(isoYYYYMMDD + 'T00:00:00Z')
    base.setUTCDate(base.getUTCDate() + days)
    return base.toISOString().slice(0, 10)
  }
  
  export function getRange(rangeDays: number = 30, tz: string = 'Asia/Seoul') {
    const now = new Date()
    const toISO = toISODateInTZ(now, tz) // 오늘(현지)
    const fromISO = addDaysISO(toISO, -(rangeDays - 1))
    return {
      fromISO, // 'YYYY-MM-DD'
      toISO,   // 'YYYY-MM-DD'
      range: rangeDays,
      timeZone: tz,
    }
  }
  