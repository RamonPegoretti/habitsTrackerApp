import { useState } from 'react'
import { useData } from '../lib/data'
import { WEEKDAY_SHORT } from '../lib/dates'
import type { Habit } from '../lib/types'

type Draft = { id?: string; name: string; emoji: string; days: number[]; weeklyTarget: number | null }

const EMPTY: Draft = { name: '', emoji: '✅', days: [0, 1, 2, 3, 4, 5, 6], weeklyTarget: null }

export function HabitsView() {
  const { habits, saveHabit, removeHabit, moveHabit } = useData()
  const [draft, setDraft] = useState<Draft | null>(null)

  const edit = (h: Habit) => setDraft({ id: h.id, name: h.name, emoji: h.emoji, days: h.days, weeklyTarget: h.weeklyTarget })

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted">Settings</div>
          <h1 className="text-3xl font-bold">My Habits</h1>
        </div>
        <button className="btn" onClick={() => setDraft({ ...EMPTY })}>
          + New habit
        </button>
      </div>

      {draft && <HabitForm draft={draft} onCancel={() => setDraft(null)} onSave={async (d) => (await saveHabit(d), setDraft(null))} />}

      <ul className="space-y-2">
        {habits.map((h, i) => (
          <li key={h.id} className="panel flex items-center gap-3 p-3">
            <div className="flex flex-col">
              <button
                className="px-1 text-muted disabled:opacity-20"
                disabled={i === 0}
                onClick={() => moveHabit(h, -1)}
                aria-label="Move up"
              >
                ▲
              </button>
              <button
                className="px-1 text-muted disabled:opacity-20"
                disabled={i === habits.length - 1}
                onClick={() => moveHabit(h, 1)}
                aria-label="Move down"
              >
                ▼
              </button>
            </div>
            <span className="text-2xl">{h.emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{h.name}</div>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                {WEEKDAY_SHORT.map((d, di) => (
                  <span key={d} className={`rounded px-1.5 text-[10px] ${h.days.includes(di) ? 'bg-cyan/20 text-cyan' : 'text-white/25'}`}>
                    {d}
                  </span>
                ))}
                {h.weeklyTarget != null && h.weeklyTarget < h.days.length && (
                  <span className="ml-1 text-[11px] text-muted">
                    · {h.weeklyTarget} of {h.days.length} counts as full
                  </span>
                )}
              </div>
            </div>
            <button className="btn-ghost text-sm" onClick={() => edit(h)}>
              Edit
            </button>
            <button
              className="btn-ghost text-sm text-pink"
              onClick={() => {
                if (confirm(`Remove “${h.name}”? Past days keep their history.`)) removeHabit(h)
              }}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function HabitForm({ draft, onCancel, onSave }: { draft: Draft; onCancel: () => void; onSave: (d: Draft) => Promise<void> }) {
  const [d, setD] = useState(draft)
  const [busy, setBusy] = useState(false)
  const toggleDay = (i: number) =>
    setD((x) => {
      const days = x.days.includes(i) ? x.days.filter((y) => y !== i) : [...x.days, i].sort()
      const weeklyTarget = x.weeklyTarget != null ? Math.min(x.weeklyTarget, days.length) : null
      return { ...x, days, weeklyTarget }
    })
  const valid = d.name.trim() && d.days.length > 0

  return (
    <form
      className="panel space-y-4 p-4"
      style={{ borderColor: '#22d3ee66' }}
      onSubmit={async (e) => {
        e.preventDefault()
        if (!valid) return
        setBusy(true)
        await onSave({ ...d, name: d.name.trim(), emoji: d.emoji.trim() || '✅' })
        setBusy(false)
      }}
    >
      <div className="flex gap-3">
        <label className="w-20">
          <span className="mb-1 block text-xs text-muted">Emoji</span>
          <input
            className="input text-center text-xl"
            value={d.emoji}
            onChange={(e) => setD({ ...d, emoji: e.target.value })}
            maxLength={4}
          />
        </label>
        <label className="flex-1">
          <span className="mb-1 block text-xs text-muted">Name</span>
          <input
            className="input"
            value={d.name}
            onChange={(e) => setD({ ...d, name: e.target.value })}
            placeholder="e.g. Footwork 15 min"
            autoFocus
          />
        </label>
      </div>
      <div>
        <span className="mb-1 block text-xs text-muted">Days</span>
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAY_SHORT.map((label, i) => (
            <button
              type="button"
              key={label}
              onClick={() => toggleDay(i)}
              className={`h-9 w-10 rounded-lg border text-sm ${d.days.includes(i) ? 'border-cyan bg-cyan/20 text-cyan' : 'border-line text-muted'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <label className="flex flex-wrap items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={d.weeklyTarget != null}
          onChange={(e) => setD({ ...d, weeklyTarget: e.target.checked ? Math.max(1, d.days.length - 1) : null })}
        />
        Count the week as full after
        <input
          type="number"
          min={1}
          max={d.days.length}
          disabled={d.weeklyTarget == null}
          value={d.weeklyTarget ?? ''}
          onChange={(e) => setD({ ...d, weeklyTarget: Math.max(1, Math.min(d.days.length, Number(e.target.value) || 1)) })}
          className="input !w-16 !py-1 text-center disabled:opacity-40"
        />
        of {d.days.length} days (skipped days don't break the streak)
      </label>
      <div className="flex gap-2">
        <button className="btn" disabled={!valid || busy}>
          {busy ? 'Saving…' : draft.id ? 'Save' : 'Add habit'}
        </button>
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
