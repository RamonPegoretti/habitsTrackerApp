import type { Habit } from './types'

type Starter = Omit<Habit, 'id' | 'order' | 'start' | 'end'>

const DAILY = [0, 1, 2, 3, 4, 5, 6]

/** Starter habits picked for Ramon: épée training, running, and the mental side. */
export const STARTER_HABITS: Starter[] = [
  { name: 'Fencing training', emoji: '🤺', days: [0, 1, 2, 3], weeklyTarget: 3 },
  { name: 'Run 25 min', emoji: '🏃', days: [5, 6], weeklyTarget: null },
  { name: 'Stretch 10 min', emoji: '🧘', days: DAILY, weeklyTarget: null },
  { name: 'Visualise bouts 5 min', emoji: '🧠', days: DAILY, weeklyTarget: null },
  { name: 'Breathing reset 3 min', emoji: '🌬️', days: DAILY, weeklyTarget: null },
  { name: 'Training journal', emoji: '📓', days: [0, 1, 2, 3], weeklyTarget: 3 },
  { name: 'Drink 2 L water', emoji: '💧', days: DAILY, weeklyTarget: null },
]
