# Streakboard

A neon habit tracker, inspired by the "Streakboard" reel: a month grid of habits × days, a week board with Big 3 tasks and XP, levels and streaks. Built for épée training, but every habit is editable.

- **Today**: today's habits, Big 3 + tasks, training journal, and **Copy for Claude** (copies the last 7 days plus a mental-coach prompt to paste into a Claude chat).
- **Week**: Mon–Sun columns with a progress ring, Big 3 (+30 XP) and tasks (+10 XP), week XP, best day.
- **Month**: habit grid with coloured week bands, completed %, perfect days, best run, daily score and progress chart.
- **Habits**: add, edit, reorder, remove. A habit can have a weekly target (e.g. fencing 3 of 4 days) so skipped days don't break the streak.

Stack: React + TypeScript + Vite, Tailwind CSS, Firebase (Auth + Firestore), installable as a PWA, hosted on Vercel.

## Rules

- Habit check-in +10 XP, Big 3 task +30 XP, task +10 XP.
- Level L → L+1 needs 50·L·(L+1) XP in total (level 10 at 4,500).
- A **perfect day** has every scheduled habit done. The **streak** counts perfect days in a row; today only adds once it's perfect, it never breaks the streak.

## Setup

1. Create a Firebase project with **Authentication → Email/Password** and **Firestore** enabled.
2. Copy `.env.example` to `.env` and fill in the web app config.
3. Paste `firestore.rules` into **Firestore → Rules** and publish (or `firebase deploy --only firestore:rules`).
4. `npm install && npm run dev`

Sign-in is username + password. The email is only used for the confirmation link (and password resets); the app stays locked until it's confirmed.

### Local development without a real project

```sh
npx firebase-tools emulators:start --only auth,firestore --project demo-streakboard
VITE_FIREBASE_API_KEY=demo VITE_FIREBASE_PROJECT_ID=demo-streakboard VITE_USE_EMULATORS=1 npm run dev
```

Confirmation links show up at `http://127.0.0.1:9099/emulator/v1/projects/demo-streakboard/oobCodes`.

## Deploy (Vercel)

Import the repo in Vercel (framework: Vite) and add the `VITE_FIREBASE_*` variables. Then add the Vercel domain under **Firebase → Authentication → Settings → Authorized domains**.
