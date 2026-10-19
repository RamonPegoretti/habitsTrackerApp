const pad = (n: number) => String(n).padStart(2, '0')

/** Local date as YYYY-MM-DD. */
export function toKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayKey(): string {
  return toKey(new Date())
}

export function addDays(key: string, n: number): string {
  const d = fromKey(key)
  d.setDate(d.getDate() + n)
  return toKey(d)
}

/** 0 = Monday … 6 = Sunday. */
export function weekday(key: string): number {
  return (fromKey(key).getDay() + 6) % 7
}

export function weekStart(key: string): string {
  return addDays(key, -weekday(key))
}

export function weekKeys(key: string): string[] {
  const start = weekStart(key)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function monthKeys(year: number, month: number): string[] {
  const days = new Date(year, month + 1, 0).getDate()
  return Array.from({ length: days }, (_, i) => toKey(new Date(year, month, i + 1)))
}

export const WEEKDAY_SHORT = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
export const WEEKDAY_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function monthName(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleString('en', { month: 'long' })
}

export function shortDate(key: string): string {
  return fromKey(key).toLocaleString('en', { month: 'short', day: 'numeric' })
}

/** Link to a day on the Today page (today itself has no date in the link). */
export function dayHref(key: string): string {
  return key === todayKey() ? '#/today' : `#/today?d=${key}`
}
