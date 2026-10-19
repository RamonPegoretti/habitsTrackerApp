import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, setDoc, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from './firebase'
import { todayKey } from './dates'
import { HISTORY_START } from './scoring'
import { STARTER_HABITS } from './seed'
import type { DayDoc, Habit, Journal, Task } from './types'
import type { Days } from './scoring'

interface DataValue {
  ready: boolean
  /** Habits still active today, in display order. */
  habits: Habit[]
  /** Every habit ever created (removed ones keep their history). */
  allHabits: Habit[]
  days: Days
  tasks: Task[]
  toggleCheck: (key: string, habitId: string) => Promise<void>
  saveJournal: (key: string, journal: Journal) => Promise<void>
  addTask: (key: string, title: string, big: boolean) => Promise<void>
  toggleTask: (t: Task) => Promise<void>
  deleteTask: (t: Task) => Promise<void>
  saveHabit: (h: Omit<Habit, 'id' | 'order' | 'end'> & { id?: string }) => Promise<void>
  removeHabit: (h: Habit) => Promise<void>
  moveHabit: (h: Habit, dir: -1 | 1) => Promise<void>
}

const DataContext = createContext<DataValue | null>(null)

/** One-time move: habits created before past-day editing existed count back to HISTORY_START. */
async function backfillStarts(uid: string) {
  const snap = await getDocs(collection(db, 'users', uid, 'habits'))
  const batch = writeBatch(db)
  snap.docs.forEach((d) => {
    if ((d.data().start as string) > HISTORY_START) batch.update(d.ref, { start: HISTORY_START })
  })
  batch.set(doc(db, 'users', uid), { historyFrom: HISTORY_START }, { merge: true })
  await batch.commit()
}

// Guards against seeding twice when the effect runs twice (React StrictMode).
const seeding = new Set<string>()

export function DataProvider({ uid, username, children }: { uid: string; username: string; children: ReactNode }) {
  const [habitList, setHabitList] = useState<Habit[] | null>(null)
  const [days, setDays] = useState<Days | null>(null)
  const [tasks, setTasks] = useState<Task[] | null>(null)

  useEffect(() => {
    // First sign-in: add the starter habits once.
    const userRef = doc(db, 'users', uid)
    if (!seeding.has(uid)) {
      seeding.add(uid)
      getDoc(userRef).then(async (snap) => {
        if (snap.exists() && snap.data().seeded) {
          if (!snap.data().historyFrom) await backfillStarts(uid)
          return
        }
        const batch = writeBatch(db)
        const start = HISTORY_START
        STARTER_HABITS.forEach((h, i) => {
          batch.set(doc(collection(db, 'users', uid, 'habits')), { ...h, order: i, start, end: null })
        })
        batch.set(userRef, { username, seeded: true, historyFrom: HISTORY_START, createdAt: Date.now() }, { merge: true })
        await batch.commit()
      })
    }

    const unsubs = [
      onSnapshot(collection(db, 'users', uid, 'habits'), (s) =>
        setHabitList(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Habit, 'id'>) }))),
      ),
      onSnapshot(collection(db, 'users', uid, 'days'), (s) => {
        const next: Days = {}
        s.docs.forEach((d) => (next[d.id] = d.data() as DayDoc))
        setDays(next)
      }),
      onSnapshot(collection(db, 'users', uid, 'tasks'), (s) =>
        setTasks(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Task, 'id'>) }))),
      ),
    ]
    return () => unsubs.forEach((u) => u())
  }, [uid, username])

  const value = useMemo<DataValue>(() => {
    const allHabits = [...(habitList ?? [])].sort((a, b) => a.order - b.order)
    const today = todayKey()
    const habits = allHabits.filter((h) => !h.end || h.end > today)
    const dayRef = (key: string) => doc(db, 'users', uid, 'days', key)
    return {
      ready: habitList != null && days != null && tasks != null,
      habits,
      allHabits,
      days: days ?? {},
      tasks: [...(tasks ?? [])].sort((a, b) => a.createdAt - b.createdAt),
      async toggleCheck(key, habitId) {
        const on = !days?.[key]?.checks?.[habitId]
        await setDoc(dayRef(key), { checks: { [habitId]: on } }, { merge: true })
      },
      async saveJournal(key, journal) {
        await setDoc(dayRef(key), { journal }, { merge: true })
      },
      async addTask(key, title, big) {
        await addDoc(collection(db, 'users', uid, 'tasks'), { date: key, title, big, done: false, createdAt: Date.now() })
      },
      async toggleTask(t) {
        await updateDoc(doc(db, 'users', uid, 'tasks', t.id), { done: !t.done })
      },
      async deleteTask(t) {
        await deleteDoc(doc(db, 'users', uid, 'tasks', t.id))
      },
      async saveHabit({ id, ...fields }) {
        if (id) {
          await updateDoc(doc(db, 'users', uid, 'habits', id), fields)
        } else {
          const order = allHabits.reduce((m, h) => Math.max(m, h.order), -1) + 1
          await addDoc(collection(db, 'users', uid, 'habits'), { ...fields, order, end: null })
        }
      },
      async removeHabit(h) {
        // Created today: nothing to keep, delete it. Otherwise end it so past days keep their history.
        if (h.start >= today) await deleteDoc(doc(db, 'users', uid, 'habits', h.id))
        else await updateDoc(doc(db, 'users', uid, 'habits', h.id), { end: today })
      },
      async moveHabit(h, dir) {
        const i = habits.findIndex((x) => x.id === h.id)
        const other = habits[i + dir]
        if (!other) return
        const batch = writeBatch(db)
        batch.update(doc(db, 'users', uid, 'habits', h.id), { order: other.order })
        batch.update(doc(db, 'users', uid, 'habits', other.id), { order: h.order })
        await batch.commit()
      },
    }
  }, [habitList, days, tasks, uid])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData outside DataProvider')
  return ctx
}
