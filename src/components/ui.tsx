import type { CSSProperties, ReactNode } from 'react'
import type { HabitStatus } from '../lib/scoring'

export const WEEK_COLORS = ['#c084fc', '#22d3ee', '#2dd4bf', '#facc15', '#f472b6']
export const DAY_COLORS = ['#22d3ee', '#a3e635', '#facc15', '#2dd4bf', '#c084fc', '#fb923c', '#f472b6']

export function Ring({
  pct,
  color,
  size = 96,
  stroke = 9,
  children,
}: {
  pct: number
  color: string
  size?: number
  stroke?: number
  children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ffffff12" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(1, Math.max(0, pct)))}
          style={{ filter: `drop-shadow(0 0 6px ${color}aa)`, transition: 'stroke-dashoffset .5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}

export function Check({
  status,
  color,
  size = 22,
  onClick,
  title,
}: {
  status: HabitStatus
  color: string
  size?: number
  onClick?: () => void
  title?: string
}) {
  if (status === 'off') {
    return (
      <div className="grid place-items-center" style={{ width: size, height: size }} title={title}>
        <span className="block h-1 w-1 rounded-full bg-white/15" />
      </div>
    )
  }
  const done = status === 'done'
  const style: CSSProperties = {
    width: size,
    height: size,
    borderRadius: size * 0.28,
    borderColor: done ? color : status === 'excused' ? '#ffffff22' : status === 'missed' ? '#ffffff30' : `${color}66`,
    background: done ? color : 'transparent',
    boxShadow: done ? `0 0 10px -1px ${color}` : undefined,
  }
  const mark = (
    <>
      {done && (
        <svg viewBox="0 0 24 24" width={size * 0.62} height={size * 0.62}>
          <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#0b0d2a" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {status === 'excused' && <span className="text-[9px] leading-none text-white/40">–</span>}
    </>
  )
  const cls = 'grid shrink-0 place-items-center border-2'
  // Without a handler it's display-only (it may sit inside another button).
  if (!onClick) {
    return (
      <span className={cls} style={style} title={title}>
        {mark}
      </span>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={done}
      className={`${cls} transition-transform active:scale-90`}
      style={style}
    >
      {mark}
    </button>
  )
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  color = '#22d3ee',
}: {
  label: string
  value: ReactNode
  sub?: string
  icon?: string
  color?: string
}) {
  return (
    <div className="panel p-4">
      <div className="flex items-center gap-2 text-xs text-muted">
        {icon && <span>{icon}</span>}
        {label}
      </div>
      <div className="mt-2 text-3xl font-bold" style={{ color }}>
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  )
}

export function AreaChart({ values, color = '#22d3ee', height = 90 }: { values: number[]; color?: string; height?: number }) {
  const w = 600
  if (values.length < 2) return <div style={{ height }} />
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, height - 6 - v * (height - 12)] as const)
  // Smooth the line with simple cubic segments.
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const mx = (x0 + x1) / 2
    d += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`
  }
  const id = `g${color.slice(1)}`
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="block w-full" style={{ height }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.45} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${d} L${w},${height} L0,${height} Z`} fill={`url(#${id})`} />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        vectorEffect="non-scaling-stroke"
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </svg>
  )
}

export function NavArrows({ onPrev, onNext, label }: { onPrev: () => void; onNext: () => void; label?: string }) {
  return (
    <div className="flex items-center gap-2">
      <button className="btn-ghost px-3" onClick={onPrev} aria-label="Previous">
        ‹
      </button>
      {label && <span className="min-w-24 text-center text-sm text-muted">{label}</span>}
      <button className="btn-ghost px-3" onClick={onNext} aria-label="Next">
        ›
      </button>
    </div>
  )
}
