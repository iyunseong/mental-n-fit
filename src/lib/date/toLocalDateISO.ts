// src/lib/date/toLocalDateISO.ts
export function toLocalDateISO(d = new Date()): string {
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return local.toISOString().slice(0, 10);
}


