import { useState } from 'react'
import { useData } from '../lib/data'
import { XP } from '../lib/scoring'
import { Check } from './ui'

export const BIG_LIMIT = 3

export function TaskList({ dayKey, big, color, compact = false }: { dayKey: string; big: boolean; color: string; compact?: boolean }) {
  const { tasks, addTask, toggleTask, deleteTask } = useData()
  const [draft, setDraft] = useState('')
  const list = tasks.filter((t) => t.date === dayKey && t.big === big)
  const full = big && list.length >= BIG_LIMIT

  const submit = async () => {
    const title = draft.trim()
    if (!title || full) return
    setDraft('')
    await addTask(dayKey, title, big)
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-muted">
        <span>{big ? 'Big 3' : 'Tasks'}</span>
        <span>+{big ? XP.big : XP.task} XP</span>
      </div>
      <ul className="space-y-1.5">
        {list.map((t) => (
          <li
            key={t.id}
            className="group flex items-center gap-2 rounded-lg px-2 py-1.5"
            style={t.done && big ? { background: color, color: '#0b0d2a' } : { background: '#ffffff08' }}
          >
            {big && <span className="text-xs">★</span>}
            <span className={`min-w-0 flex-1 truncate text-sm ${t.done ? 'line-through opacity-70' : ''}`} title={t.title}>
              {t.title}
            </span>
            <button
              onClick={() => deleteTask(t)}
              className="text-xs opacity-0 transition group-hover:opacity-60 hover:!opacity-100 max-sm:opacity-40"
              aria-label="Delete task"
            >
              ✕
            </button>
            <Check
              status={t.done ? 'done' : 'pending'}
              color={t.done && big ? '#ffffff' : color}
              size={compact ? 18 : 20}
              onClick={() => toggleTask(t)}
            />
          </li>
        ))}
      </ul>
      {!full && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
          className="mt-1.5"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={big ? '+ Big task' : '+ Task'}
            className="w-full rounded-lg border border-dashed border-white/10 bg-transparent px-2 py-1.5 text-sm placeholder:text-white/30 focus:border-cyan/60 focus:outline-none"
          />
        </form>
      )}
    </div>
  )
}
