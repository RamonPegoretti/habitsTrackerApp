import { useState } from 'react'
import { useData } from '../lib/data'
import { WEEKDAY_LONG, addDays, dayHref, shortDate, todayKey, weekday } from '../lib/dates'
import { HISTORY_START, XP, summarizeDay } from '../lib/scoring'
import { buildCoachText } from '../lib/coach'
import { Check, DAY_COLORS, Ring } from '../components/ui'
import { TaskList } from '../components/TaskList'
import { useProgress } from '../components/LevelBar'

export function TodayView({ day }: { day: string | null }) {
  const { allHabits, days, tasks, toggleCheck } = useData()
  const progress = useProgress()
  const today = todayKey()
  // Only today and past days back to HISTORY_START can be opened.
  const key = day && /^\d{4}-\d{2}-\d{2}$/.test(day) && day < today && day >= HISTORY_START ? day : today
  const isToday = key === today
  const color = DAY_COLORS[weekday(key)]
  const summary = summarizeDay(allHabits, key, days, today)
  const scheduled = allHabits.filter((h) => summary.statuses[h.id] !== 'off')
  const go = (k: string) => (location.hash = dayHref(k))

  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle')

  const copy = async () => {
    const text = buildCoachText({ habits: allHabits, days, tasks, today, level: progress.level, xp: progress.xp, streak: progress.streak })
    try {
      await navigator.clipboard.writeText(text)
      setCopied('ok')
    } catch {
      setCopied('fail')
    }
    setTimeout(() => setCopied('idle'), 2500)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted">
            {shortDate(key)}
            {!isToday && ' · past day'}
          </div>
          <h1 className="text-3xl font-bold">{WEEKDAY_LONG[weekday(key)]}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="btn-ghost px-3 disabled:opacity-30"
            onClick={() => go(addDays(key, -1))}
            disabled={key <= HISTORY_START}
            aria-label="Previous day"
          >
            ‹
          </button>
          <button
            className="btn-ghost px-3 disabled:opacity-30"
            onClick={() => go(addDays(key, 1))}
            disabled={isToday}
            aria-label="Next day"
          >
            ›
          </button>
          {!isToday && (
            <button className="btn-ghost text-sm" onClick={() => go(today)}>
              Back to today
            </button>
          )}
        </div>
        <button className="btn flex items-center gap-2" onClick={copy}>
          {copied === 'ok' ? '✓ Copied, paste it into Claude' : copied === 'fail' ? 'Copy failed, try again' : '📋 Copy for Claude'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
        <section className="panel p-4">
          <div className="mb-3 flex items-center gap-4">
            <Ring pct={summary.pct} color={color} size={84}>
              <div>
                <div className="text-lg font-bold">{Math.round(summary.pct * 100)}%</div>
                <div className="text-[10px] text-muted">
                  {summary.done} of {summary.counted}
                </div>
              </div>
            </Ring>
            <div>
              <h2 className="text-lg font-semibold">{isToday ? "Today's habits" : 'Habits'}</h2>
              <p className="text-sm text-muted">+{XP.habit} XP each</p>
            </div>
          </div>
          <ul className="space-y-2">
            {scheduled.map((h) => {
              const s = summary.statuses[h.id]
              return (
                <li key={h.id}>
                  <button
                    onClick={() => toggleCheck(key, h.id)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition"
                    style={{
                      background: s === 'done' ? `${color}22` : '#ffffff08',
                      border: `1px solid ${s === 'done' ? color + '66' : 'transparent'}`,
                    }}
                  >
                    <span className="text-xl">{h.emoji}</span>
                    <span className={`flex-1 ${s === 'done' ? 'text-white' : ''}`}>{h.name}</span>
                    <Check status={s} color={color} size={24} />
                  </button>
                </li>
              )
            })}
            {scheduled.length === 0 && <li className="text-sm text-muted">Nothing scheduled. Rest day.</li>}
          </ul>
        </section>

        <section className="panel space-y-4 p-4">
          <TaskList dayKey={key} big color={color} />
          <TaskList dayKey={key} big={false} color={color} />
        </section>
      </div>

      {/* Remount once the saved entry arrives (e.g. written on another device). */}
      <JournalCard key={`${key}-${days[key]?.journal ? 'loaded' : 'empty'}`} dayKey={key} />
    </div>
  )
}

function JournalCard({ dayKey }: { dayKey: string }) {
  const { days, saveJournal } = useData()
  const saved = days[dayKey]?.journal
  const [worked, setWorked] = useState(saved?.worked ?? '')
  const [fix, setFix] = useState(saved?.fix ?? '')
  const [journalState, setJournalState] = useState<'idle' | 'saving' | 'saved'>('idle')

  const save = async () => {
    setJournalState('saving')
    await saveJournal(dayKey, { worked: worked.trim(), fix: fix.trim() })
    setJournalState('saved')
  }

  return (
    <section className="panel p-4">
      <h2 className="text-lg font-semibold">📓 Training journal</h2>
      <p className="mb-3 text-sm text-muted">After training or a competition. Short is fine.</p>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-wider text-lime">One thing that worked</span>
          <textarea className="input min-h-20" value={worked} onChange={(e) => (setWorked(e.target.value), setJournalState('idle'))} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-wider text-pink">One thing to fix</span>
          <textarea className="input min-h-20" value={fix} onChange={(e) => (setFix(e.target.value), setJournalState('idle'))} />
        </label>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button className="btn-ghost" onClick={save} disabled={journalState === 'saving'}>
          {journalState === 'saving' ? 'Saving…' : 'Save journal'}
        </button>
        {journalState === 'saved' && <span className="text-sm text-teal">Saved</span>}
      </div>
    </section>
  )
}
