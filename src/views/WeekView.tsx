import { useState } from 'react'
import { useData } from '../lib/data'
import { WEEKDAY_LONG, addDays, dayHref, shortDate, todayKey, weekKeys } from '../lib/dates'
import { HISTORY_START, XP, summarizeDay, taskXp } from '../lib/scoring'
import { DAY_COLORS, NavArrows, Ring, StatCard } from '../components/ui'
import { TaskList } from '../components/TaskList'

export function WeekView() {
  const { allHabits, days, tasks } = useData()
  const today = todayKey()
  const [anchor, setAnchor] = useState(today)
  const keys = weekKeys(anchor)

  const cols = keys.map((k) => {
    const s = summarizeDay(allHabits, k, days, today)
    const dayTasks = tasks.filter((t) => t.date === k)
    const total = s.counted + dayTasks.length
    const done = s.done + dayTasks.filter((t) => t.done).length
    const earned = s.done * XP.habit + dayTasks.filter((t) => t.done).reduce((a, t) => a + taskXp(t), 0)
    const possible = s.counted * XP.habit + dayTasks.reduce((a, t) => a + taskXp(t), 0)
    return { key: k, s, total, done, pct: total ? done / total : 0, earned, possible }
  })

  const total = cols.reduce((a, c) => a + c.total, 0)
  const done = cols.reduce((a, c) => a + c.done, 0)
  const earned = cols.reduce((a, c) => a + c.earned, 0)
  const possible = cols.reduce((a, c) => a + c.possible, 0)
  const score = total ? done / total : 0
  const withItems = cols.filter((c) => c.total > 0)
  const best = withItems.reduce<(typeof cols)[number] | null>((b, c) => (!b || c.pct > b.pct ? c : b), null)
  const past = withItems.filter((c) => c.key < today)
  const worst = past.reduce<(typeof cols)[number] | null>((w, c) => (!w || c.pct < w.pct ? c : w), null)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted">
            {shortDate(keys[0])} – {shortDate(keys[6])}
          </div>
          <h1 className="text-3xl font-bold">{keys.includes(today) ? 'This Week' : 'Week'}</h1>
        </div>
        <NavArrows onPrev={() => setAnchor(addDays(anchor, -7))} onNext={() => setAnchor(addDays(anchor, 7))} />
      </div>

      <div className="panel p-4" style={{ borderColor: '#c084fc55' }}>
        <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted">
          <span>Week score</span>
          <span>
            {done} / {total} done
          </span>
        </div>
        <div className="mt-2 flex items-center gap-4">
          <div className="text-3xl font-black text-pink" style={{ textShadow: '0 0 12px #f472b6' }}>
            {Math.round(score * 100)}%
          </div>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full"
              style={{ width: `${score * 100}%`, background: 'linear-gradient(90deg,#f472b6,#c084fc)', boxShadow: '0 0 12px #f472b6' }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon="⚡"
          label="Week XP"
          value={
            <>
              {earned}
              <span className="text-base font-medium text-muted"> / {possible}</span>
            </>
          }
          sub={`${done} of ${total} done`}
          color="#e8eaff"
        />
        <StatCard
          icon="🏆"
          label="Best day"
          value={best && best.done > 0 ? WEEKDAY_LONG[keys.indexOf(best.key)].slice(0, 3) : '–'}
          sub={worst && worst.pct < 1 ? `Needs focus: ${WEEKDAY_LONG[keys.indexOf(worst.key)].slice(0, 3)}` : 'Keep it going'}
          color="#2dd4bf"
        />
      </div>

      <div className="scroll-x -mx-4 snap-x snap-mandatory px-4 pb-2">
        <div className="grid min-w-max grid-flow-col gap-3" style={{ gridAutoColumns: 'minmax(200px, 1fr)' }}>
          {cols.map((c, i) => {
            const color = DAY_COLORS[i]
            const isToday = c.key === today
            return (
              <div
                key={c.key}
                className="panel snap-start space-y-4 p-3"
                style={isToday ? { borderColor: color, boxShadow: `0 0 24px -8px ${color}` } : undefined}
              >
                <div className="text-center">
                  {c.key <= today && c.key >= HISTORY_START ? (
                    <a href={dayHref(c.key)} className="text-lg font-semibold hover:underline" title="Open this day">
                      {WEEKDAY_LONG[i]}
                    </a>
                  ) : (
                    <div className="text-lg font-semibold">{WEEKDAY_LONG[i]}</div>
                  )}
                  <div className="text-xs text-muted">
                    {shortDate(c.key)}
                    {isToday && <span style={{ color }}> · Today</span>}
                  </div>
                  <div className="mx-auto mt-2 h-0.5 w-16 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                </div>
                <div className="flex justify-center">
                  <Ring pct={c.pct} color={color} size={100}>
                    <div>
                      <div className="text-xl font-bold">{Math.round(c.pct * 100)}%</div>
                      <div className="text-[10px] text-muted">
                        {c.done} of {c.total}
                      </div>
                    </div>
                  </Ring>
                </div>
                <div className="text-center text-xs text-muted">
                  Habits {c.s.done}/{c.s.counted}
                </div>
                <TaskList dayKey={c.key} big color={color} compact />
                <TaskList dayKey={c.key} big={false} color={color} compact />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
