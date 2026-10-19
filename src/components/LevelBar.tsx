import { useData } from '../lib/data'
import { countPerfect, currentStreak, levelInfo, summarizeDay, totalXp } from '../lib/scoring'
import { addDays, todayKey } from '../lib/dates'

export function useProgress() {
  const { allHabits, days, tasks } = useData()
  const today = todayKey()
  const xp = totalXp(allHabits, days, tasks)
  const streak = currentStreak(allHabits, days, today)
  // All-time perfect days, from the first habit's start up to today.
  const first = allHabits.reduce<string | null>((m, h) => (m == null || h.start < m ? h.start : m), null)
  const summaries = []
  if (first) for (let k = first; k <= today; k = addDays(k, 1)) summaries.push(summarizeDay(allHabits, k, days, today))
  return { ...levelInfo(xp), streak, perfect: countPerfect(summaries) }
}

export function LevelBar() {
  const p = useProgress()
  return (
    <div className="panel flex items-center gap-4 p-3 sm:p-4" style={{ borderColor: '#22d3ee55', boxShadow: '0 0 24px -10px #22d3ee' }}>
      <div className="text-center">
        <div className="text-[10px] uppercase tracking-widest text-muted">Level</div>
        <div className="text-3xl font-black text-cyan" style={{ textShadow: '0 0 12px #22d3ee' }}>
          {p.level}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex justify-between text-[11px] uppercase tracking-wider text-muted">
          <span>{p.xp.toLocaleString()} XP</span>
          <span>Level up at {p.next.toLocaleString()}</span>
        </div>
        <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.round(p.progress * 100)}%`,
              background: 'linear-gradient(90deg,#22d3ee,#a78bfa,#f472b6)',
              boxShadow: '0 0 12px #22d3ee',
            }}
          />
        </div>
      </div>
      <div className="flex gap-3 text-center">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted">Streak</div>
          <div className="text-xl font-bold">🔥 {p.streak}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted">Perfect</div>
          <div className="text-xl font-bold">⭐ {p.perfect}</div>
        </div>
      </div>
    </div>
  )
}
