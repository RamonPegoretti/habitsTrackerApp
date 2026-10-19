import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { AuthScreen, AuthShell, VerifyScreen } from './auth/AuthScreen'
import { DataProvider, useData } from './lib/data'
import { firebaseConfigured } from './lib/firebase'
import { TodayView } from './views/TodayView'
import { WeekView } from './views/WeekView'
import { MonthView } from './views/MonthView'
import { HabitsView } from './views/HabitsView'

const ROUTES = [
  { id: 'today', label: 'Today', icon: '◎' },
  { id: 'week', label: 'Week', icon: '▦' },
  { id: 'month', label: 'Month', icon: '▤' },
  { id: 'habits', label: 'Habits', icon: '✎' },
] as const

type Route = (typeof ROUTES)[number]['id']

function useRoute(): Route {
  const read = () => {
    const id = location.hash.replace('#/', '')
    return (ROUTES.find((r) => r.id === id)?.id ?? 'today') as Route
  }
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const on = () => setRoute(read())
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])
  return route
}

function Shell() {
  const route = useRoute()
  const { ready } = useData()
  const { user, logOut } = useAuth()

  return (
    <div className="mx-auto flex min-h-screen max-w-[1400px]">
      <aside className="sticky top-0 hidden h-screen w-52 shrink-0 flex-col gap-1 p-4 md:flex">
        <div className="mb-6 flex items-center gap-2.5 px-2">
          <img src="/icon.svg" alt="" className="h-9 w-9" />
          <div>
            <div className="font-bold">Streakboard</div>
            <div className="text-[11px] text-muted">Habit tracker</div>
          </div>
        </div>
        {ROUTES.map((r) => (
          <a
            key={r.id}
            href={`#/${r.id}`}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${route === r.id ? 'bg-white/10 text-cyan' : 'text-muted hover:bg-white/5'}`}
          >
            <span className="w-4 text-center">{r.icon}</span>
            {r.label}
          </a>
        ))}
        <div className="mt-auto px-3 text-xs text-muted">
          <div className="truncate">@{user?.displayName}</div>
          <button onClick={logOut} className="mt-1 hover:text-cyan">
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 pb-28 md:p-6 md:pb-6" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
        <div className="mb-3 flex items-center justify-between md:hidden">
          <div className="flex items-center gap-2">
            <img src="/icon.svg" alt="" className="h-7 w-7" />
            <span className="font-bold">Streakboard</span>
          </div>
          <button onClick={logOut} className="text-xs text-muted">
            Sign out
          </button>
        </div>
        {!ready ? (
          <div className="py-20 text-center text-muted">Loading…</div>
        ) : route === 'today' ? (
          <TodayView />
        ) : route === 'week' ? (
          <WeekView />
        ) : route === 'month' ? (
          <MonthView />
        ) : (
          <HabitsView />
        )}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-line bg-ink/90 backdrop-blur md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {ROUTES.map((r) => (
          <a
            key={r.id}
            href={`#/${r.id}`}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] ${route === r.id ? 'text-cyan' : 'text-muted'}`}
          >
            <span className="text-lg leading-none">{r.icon}</span>
            {r.label}
          </a>
        ))}
      </nav>
    </div>
  )
}

function Gate() {
  const { user, loading } = useAuth()
  if (!firebaseConfigured) {
    return (
      <AuthShell>
        <h1 className="mb-2 text-lg font-semibold">Firebase isn't set up</h1>
        <p className="text-sm text-muted">Add the VITE_FIREBASE_* values (see .env.example) and reload.</p>
      </AuthShell>
    )
  }
  if (loading) return <div className="grid min-h-screen place-items-center text-muted">Loading…</div>
  if (!user) return <AuthScreen />
  if (!user.emailVerified) return <VerifyScreen />
  return (
    <DataProvider uid={user.uid} username={user.displayName ?? ''}>
      <Shell />
    </DataProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
