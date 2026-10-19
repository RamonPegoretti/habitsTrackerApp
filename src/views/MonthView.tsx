import { Fragment, useEffect, useRef, useState } from 'react'
import { useData } from '../lib/data'
import { WEEKDAY_SHORT, dayHref, fromKey, monthKeys, monthName, todayKey, weekday } from '../lib/dates'
import { HISTORY_START, bestRun, countPerfect, isScheduled, summarizeDay } from '../lib/scoring'
import { AreaChart, Check, NavArrows, Ring, StatCard, WEEK_COLORS } from '../components/ui'
import { LevelBar } from '../components/LevelBar'

const CELL = 26

export function MonthView() {
  const { allHabits, days, toggleCheck } = useData()
  const today = todayKey()
  const t = fromKey(today)
  const [ym, setYm] = useState({ y: t.getFullYear(), m: t.getMonth() })
  const scroller = useRef<HTMLDivElement>(null)

  // On a phone the month doesn't fit: scroll so today's column is in view.
  useEffect(() => {
    const box = scroller.current
    const el = box?.querySelector<HTMLElement>('[data-today]')
    if (!box || !el) return
    const x = el.getBoundingClientRect().left - box.getBoundingClientRect().left + box.scrollLeft
    box.scrollLeft = Math.max(0, x - box.clientWidth / 2)
  }, [ym])
  const keys = monthKeys(ym.y, ym.m)
  const summaries = keys.map((k) => summarizeDay(allHabits, k, days, today))
  const upToToday = summaries.filter((s) => s.key <= today)
  const counted = upToToday.reduce((a, s) => a + s.counted, 0)
  const done = upToToday.reduce((a, s) => a + s.done, 0)
  const completed = counted ? done / counted : 0

  // Habits that are scheduled at least once this month.
  const rows = allHabits.filter((h) => keys.some((k) => isScheduled(h, k)))
  const weeks = Array.from({ length: Math.ceil(keys.length / 7) }, (_, i) => keys.slice(i * 7, i * 7 + 7))
  const step = (d: number) => setYm(({ y, m }) => ({ y: m + d < 0 ? y - 1 : m + d > 11 ? y + 1 : y, m: (m + d + 12) % 12 }))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted">Habit tracker · {ym.y}</div>
          <h1 className="text-3xl font-bold">{monthName(ym.y, ym.m)}</h1>
        </div>
        <NavArrows onPrev={() => step(-1)} onNext={() => step(1)} />
      </div>

      <LevelBar />

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="panel flex items-center gap-3 p-4">
          <div className="hidden sm:block">
            <Ring pct={completed} color="#22d3ee" size={56} stroke={7} />
          </div>
          <div>
            <div className="text-xs text-muted">Completed</div>
            <div className="text-2xl font-bold">{Math.round(completed * 100)}%</div>
            <div className="text-[11px] text-muted">
              {done} of {counted}
            </div>
          </div>
        </div>
        <StatCard icon="⭐" label="Perfect" value={countPerfect(upToToday)} sub="days this month" color="#e8eaff" />
        <StatCard icon="🔥" label="Best run" value={bestRun(upToToday)} sub="days in a row" color="#e8eaff" />
      </div>

      <div ref={scroller} className="panel scroll-x py-3 pr-3 [--name:140px] sm:py-4 sm:pr-4 sm:[--name:212px]">
        <div
          className="grid min-w-max gap-y-1.5"
          style={{ gridTemplateColumns: `var(--name) repeat(${keys.length}, ${CELL}px)`, columnGap: 4 }}
        >
          {/* Week bands */}
          <div className="sticky left-0 z-10 pl-3 sm:pl-4 flex items-end bg-panel pb-1 text-sm font-semibold">My Habits</div>
          {weeks.map((w, wi) => (
            <div
              key={wi}
              className="rounded-t-lg px-1 pt-1 text-center text-[#0b0d2a]"
              style={{ gridColumn: `span ${w.length}`, background: WEEK_COLORS[wi], boxShadow: `0 0 14px -4px ${WEEK_COLORS[wi]}` }}
            >
              <div className="text-[11px] font-bold">Week {wi + 1}</div>
              <div className="grid" style={{ gridTemplateColumns: `repeat(${w.length}, 1fr)` }}>
                {w.map((k) => {
                  const inner = (
                    <>
                      <div className="opacity-70">{WEEKDAY_SHORT[weekday(k)]}</div>
                      <div
                        className={k === today ? 'mx-auto w-4 rounded-full bg-[#0b0d2a] text-white' : ''}
                        data-today={k === today || undefined}
                      >
                        {fromKey(k).getDate()}
                      </div>
                    </>
                  )
                  return k <= today && k >= HISTORY_START ? (
                    <a
                      key={k}
                      href={dayHref(k)}
                      className="block text-[9px] leading-tight font-semibold hover:underline"
                      title="Open this day"
                    >
                      {inner}
                    </a>
                  ) : (
                    <div key={k} className="text-[9px] leading-tight font-semibold">
                      {inner}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Habit rows */}
          {rows.map((h) => (
            <Fragment key={h.id}>
              <div className="sticky left-0 z-10 pl-3 sm:pl-4 flex items-center gap-2 truncate bg-panel pr-2 text-sm" title={h.name}>
                <span>{h.emoji}</span>
                <span className="truncate">{h.name}</span>
              </div>
              {keys.map((k, i) => {
                const s = summaries[i].statuses[h.id]
                const color = WEEK_COLORS[Math.floor(i / 7)]
                return (
                  <div key={k} className="grid place-items-center">
                    <Check
                      status={s}
                      color={color}
                      size={CELL - 4}
                      onClick={s !== 'off' && k <= today ? () => toggleCheck(k, h.id) : undefined}
                    />
                  </div>
                )
              })}
            </Fragment>
          ))}
          {rows.length === 0 && <div className="col-span-full py-6 text-center text-sm text-muted">No habits this month.</div>}

          {/* Daily score */}
          <div className="sticky left-0 z-10 pl-3 sm:pl-4 flex items-center bg-panel pt-2 text-[10px] uppercase tracking-widest text-muted">
            Daily score
          </div>
          {summaries.map((s, i) => {
            const color = WEEK_COLORS[Math.floor(i / 7)]
            const shown = s.key <= today && !s.neutral
            return (
              <div key={s.key} className="pt-2" title={shown ? `${Math.round(s.pct * 100)}%` : undefined}>
                <div
                  className="h-4 rounded"
                  style={{
                    background: shown ? color : '#ffffff10',
                    opacity: shown ? 0.25 + 0.75 * s.pct : 1,
                    boxShadow: shown && s.perfect ? `0 0 8px ${color}` : undefined,
                  }}
                />
              </div>
            )
          })}

          {/* Progress chart */}
          <div className="sticky left-0 z-10 pl-3 sm:pl-4 flex items-center bg-panel text-[10px] uppercase tracking-widest text-muted">
            Progress
          </div>
          <div style={{ gridColumn: `span ${keys.length}`, width: `${(upToToday.length / keys.length) * 100}%` }}>
            <AreaChart values={upToToday.map((s) => s.pct)} color="#22d3ee" height={80} />
          </div>
        </div>
      </div>
    </div>
  )
}
