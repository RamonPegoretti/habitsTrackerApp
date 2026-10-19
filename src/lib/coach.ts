import { WEEKDAY_LONG, addDays, shortDate, weekday } from './dates'
import { summarizeDay, type Days } from './scoring'
import type { Habit, Task } from './types'

interface Input {
  habits: Habit[]
  days: Days
  tasks: Task[]
  today: string
  level: number
  xp: number
  streak: number
}

const STATUS_MARK = { done: '✓', missed: '✗', pending: '·', excused: '(skip ok)', off: '' } as const

/** Builds a plain-text summary of the last 7 days to paste into a Claude chat. */
export function buildCoachText({ habits, days, tasks, today, level, xp, streak }: Input): string {
  const keys = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6))
  const lines: string[] = []
  lines.push(
    "You're my mental coach. I'm an épée fencer ranked 20th in Switzerland and I want to make the national team. " +
      'Mental game is what I need to work on most. Below is my last 7 days from my habit tracker. ' +
      'Look at my habits, tasks and training journal, tell me what you notice, and give me 2–3 concrete things to focus on this week. ' +
      'If I have a competition coming up, help me prepare for it (or debrief it if it just happened).',
  )
  lines.push('')
  lines.push(`Level ${level} · ${xp} XP · current streak ${streak} perfect day${streak === 1 ? '' : 's'}`)
  lines.push('')
  lines.push('HABITS (last 7 days, oldest first)')
  for (const h of habits) {
    const marks = keys
      .map((k) => {
        const s = summarizeDay([h], k, days, today).statuses[h.id]
        return s === 'off' ? null : `${WEEKDAY_LONG[weekday(k)].slice(0, 3)} ${STATUS_MARK[s]}`
      })
      .filter(Boolean)
    if (marks.length) lines.push(`- ${h.emoji} ${h.name}: ${marks.join(', ')}`)
  }
  lines.push('')
  lines.push('DAYS')
  for (const k of keys) {
    const s = summarizeDay(habits, k, days, today)
    const dayTasks = tasks.filter((t) => t.date === k)
    const j = days[k]?.journal
    const head = `${WEEKDAY_LONG[weekday(k)]} ${shortDate(k)}${k === today ? ' (today)' : ''}: habits ${s.done}/${s.counted}`
    lines.push(head)
    for (const t of dayTasks) lines.push(`  ${t.done ? '✓' : '✗'} ${t.big ? '[Big 3] ' : ''}${t.title}`)
    if (j?.worked) lines.push(`  Journal – what worked: ${j.worked}`)
    if (j?.fix) lines.push(`  Journal – what to fix: ${j.fix}`)
  }
  return lines.join('\n')
}
