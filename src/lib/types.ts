export interface Habit {
  id: string
  name: string
  emoji: string
  /** Scheduled weekdays, 0 = Monday … 6 = Sunday. */
  days: number[]
  /** If set and lower than the number of scheduled days, misses up to the difference are forgiven each week. */
  weeklyTarget: number | null
  order: number
  /** First day (YYYY-MM-DD) the habit counts. */
  start: string
  /** Day (YYYY-MM-DD) the habit was removed; it stops counting from this day. */
  end: string | null
}

export interface Journal {
  worked: string
  fix: string
}

export interface DayDoc {
  checks: Record<string, boolean>
  journal?: Journal
}

export interface Task {
  id: string
  date: string
  title: string
  big: boolean
  done: boolean
  createdAt: number
}
