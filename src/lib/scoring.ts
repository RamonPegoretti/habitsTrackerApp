import { addDays, weekKeys, weekday } from './dates'
import type { DayDoc, Habit, Task } from './types'

export const XP = { habit: 10, big: 30, task: 10 } as const

export type HabitStatus = 'off' | 'done' | 'excused' | 'missed' | 'pending'

export interface DaySummary {
  key: string
  statuses: Record<string, HabitStatus>
  /** Habits that count toward the score (done, missed or still pending). */
  counted: number
  done: number
  pct: number
  /** True when at least one habit counted and every counted habit is done. */
  perfect: boolean
  /** True when no habit counted (nothing scheduled or everything excused). */
  neutral: boolean
}

export type Days = Record<string, DayDoc>

export function isScheduled(h: Habit, key: string): boolean {
  if (key < h.start) return false
  if (h.end && key >= h.end) return false
  return h.days.includes(weekday(key))
}

function habitStatus(h: Habit, key: string, days: Days, today: string): HabitStatus {
  if (!isScheduled(h, key)) return 'off'
  if (days[key]?.checks?.[h.id]) return 'done'
  if (h.weeklyTarget != null) {
    const week = weekKeys(key).filter((k) => isScheduled(h, k))
    const allowance = week.length - h.weeklyTarget
    if (allowance > 0) {
      // Forgive the first `allowance` misses of the week (only days already over count as misses).
      let misses = 0
      for (const k of week) {
        if (k > key) break
        if (!days[k]?.checks?.[h.id] && (k < today || k === key)) misses++
      }
      if (key < today && misses <= allowance) return 'excused'
      // A pending day that could still be forgiven shows as pending; it's not a miss yet.
    }
  }
  return key < today ? 'missed' : 'pending'
}

export function summarizeDay(habits: Habit[], key: string, days: Days, today: string): DaySummary {
  const statuses: Record<string, HabitStatus> = {}
  let counted = 0
  let done = 0
  for (const h of habits) {
    const s = habitStatus(h, key, days, today)
    statuses[h.id] = s
    if (s === 'done' || s === 'missed' || s === 'pending') counted++
    if (s === 'done') done++
  }
  return {
    key,
    statuses,
    counted,
    done,
    pct: counted ? done / counted : 0,
    perfect: counted > 0 && done === counted,
    neutral: counted === 0,
  }
}

function earliestStart(habits: Habit[]): string | null {
  return habits.reduce<string | null>((min, h) => (min == null || h.start < min ? h.start : min), null)
}

/** Consecutive perfect days ending today (today only adds if already perfect, it never breaks the streak). */
export function currentStreak(habits: Habit[], days: Days, today: string): number {
  const first = earliestStart(habits)
  if (!first) return 0
  let streak = 0
  const t = summarizeDay(habits, today, days, today)
  if (t.perfect) streak++
  for (let k = addDays(today, -1); k >= first; k = addDays(k, -1)) {
    const s = summarizeDay(habits, k, days, today)
    if (s.neutral) continue
    if (!s.perfect) break
    streak++
  }
  return streak
}

/** Longest run of perfect days within the given keys (neutral days neither count nor break it). */
export function bestRun(summaries: DaySummary[]): number {
  let best = 0
  let run = 0
  for (const s of summaries) {
    if (s.neutral) continue
    run = s.perfect ? run + 1 : 0
    best = Math.max(best, run)
  }
  return best
}

export function taskXp(t: Task): number {
  return t.big ? XP.big : XP.task
}

export function totalXp(habits: Habit[], days: Days, tasks: Task[]): number {
  const ids = new Set(habits.map((h) => h.id))
  let xp = 0
  for (const [key, doc] of Object.entries(days)) {
    for (const [id, on] of Object.entries(doc.checks ?? {})) {
      const h = habits.find((x) => x.id === id)
      if (on && ids.has(id) && h && isScheduled(h, key)) xp += XP.habit
    }
  }
  for (const t of tasks) if (t.done) xp += taskXp(t)
  return xp
}

/** Reaching level L+1 takes 50·L·(L+1) XP in total (100, 300, 600, … 4,500 for level 10). */
export function levelInfo(xp: number) {
  let level = 1
  while (50 * level * (level + 1) <= xp) level++
  const floor = 50 * (level - 1) * level
  const next = 50 * level * (level + 1)
  return { level, xp, floor, next, progress: (xp - floor) / (next - floor) }
}

export function countPerfect(summaries: DaySummary[]): number {
  return summaries.filter((s) => s.perfect).length
}
