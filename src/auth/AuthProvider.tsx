import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

export const USERNAME_RE = /^[a-z0-9_.]{3,20}$/

export function normalizeUsername(u: string): string {
  return u.trim().toLowerCase()
}

async function emailFor(username: string): Promise<string> {
  const snap = await getDoc(doc(db, 'usernames', normalizeUsername(username)))
  if (!snap.exists()) throw new Error('No account with that username.')
  return snap.data().email as string
}

interface AuthValue {
  user: User | null
  loading: boolean
  signUp: (username: string, email: string, password: string) => Promise<void>
  signIn: (username: string, password: string) => Promise<void>
  resetPassword: (username: string) => Promise<void>
  resendVerification: () => Promise<void>
  refresh: () => Promise<boolean>
  logOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  // Bumped after reload() so components re-read user.emailVerified.
  const [, setVersion] = useState(0)

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u)
        setLoading(false)
      }),
    [],
  )

  const value: AuthValue = {
    user,
    loading,
    async signUp(username, email, password) {
      const name = normalizeUsername(username)
      if (!USERNAME_RE.test(name)) {
        throw new Error('Username: 3–20 characters, letters, numbers, _ or . only.')
      }
      const taken = await getDoc(doc(db, 'usernames', name))
      if (taken.exists()) throw new Error('That username is taken.')
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
      await setDoc(doc(db, 'usernames', name), { uid: cred.user.uid, email: email.trim() })
      await updateProfile(cred.user, { displayName: name })
      await sendEmailVerification(cred.user)
    },
    async signIn(username, password) {
      const email = await emailFor(username)
      await signInWithEmailAndPassword(auth, email, password)
    },
    async resetPassword(username) {
      await sendPasswordResetEmail(auth, await emailFor(username))
    },
    async resendVerification() {
      if (auth.currentUser) await sendEmailVerification(auth.currentUser)
    },
    async refresh() {
      const u = auth.currentUser
      if (!u) return false
      await u.reload()
      // Force a new token so Firestore sees the email_verified claim.
      if (u.emailVerified) await u.getIdToken(true)
      setVersion((v) => v + 1)
      return u.emailVerified
    },
    logOut: () => signOut(auth),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth outside AuthProvider')
  return ctx
}

export function authErrorMessage(e: unknown): string {
  const code = (e as { code?: string })?.code ?? ''
  const map: Record<string, string> = {
    'auth/invalid-credential': 'Wrong username or password.',
    'auth/wrong-password': 'Wrong username or password.',
    'auth/email-already-in-use': 'That email already has an account.',
    'auth/invalid-email': 'That email looks wrong.',
    'auth/weak-password': 'Password needs at least 6 characters.',
    'auth/too-many-requests': 'Too many tries. Wait a minute and try again.',
    'auth/network-request-failed': 'No connection. Check your internet.',
  }
  if (map[code]) return map[code]
  return e instanceof Error ? e.message : 'Something went wrong.'
}
