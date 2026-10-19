import { useState, type ReactNode } from 'react'
import { authErrorMessage, useAuth } from './AuthProvider'

type Mode = 'signin' | 'signup' | 'reset'

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-3">
          <img src="/icon.svg" alt="" className="h-11 w-11" />
          <div>
            <div className="text-xl font-bold">Streakboard</div>
            <div className="text-xs text-muted">Habit tracker</div>
          </div>
        </div>
        <div className="panel p-5">{children}</div>
      </div>
    </div>
  )
}

export function AuthScreen() {
  const { signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const go = (m: Mode) => {
    setMode(m)
    setError('')
    setInfo('')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    setInfo('')
    try {
      if (mode === 'signin') await signIn(username, password)
      else if (mode === 'signup') await signUp(username, email, password)
      else {
        await resetPassword(username)
        setInfo('Check your email for a link to set a new password.')
      }
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell>
      <h1 className="mb-4 text-lg font-semibold">
        {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Reset password'}
      </h1>
      <form onSubmit={submit} className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs text-muted">Username</span>
          <input
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            required
          />
        </label>
        {mode === 'signup' && (
          <label className="block">
            <span className="mb-1 block text-xs text-muted">Email (only for the confirmation link)</span>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </label>
        )}
        {mode !== 'reset' && (
          <label className="block">
            <span className="mb-1 block text-xs text-muted">Password</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              minLength={6}
              required
            />
          </label>
        )}
        {error && <p className="text-sm text-pink">{error}</p>}
        {info && <p className="text-sm text-teal">{info}</p>}
        <button className="btn w-full" disabled={busy}>
          {busy ? '…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
        </button>
      </form>
      <div className="mt-4 flex justify-between text-sm text-muted">
        {mode === 'signin' ? (
          <>
            <button onClick={() => go('signup')} className="hover:text-cyan">
              Create account
            </button>
            <button onClick={() => go('reset')} className="hover:text-cyan">
              Forgot password?
            </button>
          </>
        ) : (
          <button onClick={() => go('signin')} className="hover:text-cyan">
            ← Back to sign in
          </button>
        )}
      </div>
    </AuthShell>
  )
}

export function VerifyScreen() {
  const { user, refresh, resendVerification, logOut } = useAuth()
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const check = async () => {
    setBusy(true)
    const ok = await refresh()
    setBusy(false)
    if (!ok) setMsg('Not confirmed yet. Click the link in the email, then try again.')
  }

  return (
    <AuthShell>
      <h1 className="mb-2 text-lg font-semibold">Confirm your email</h1>
      <p className="text-sm text-muted">
        We sent a link to <span className="text-text">{user?.email}</span>. Open it, then come back here. Check spam if you can't find it.
      </p>
      {msg && <p className="mt-3 text-sm text-pink">{msg}</p>}
      <div className="mt-4 space-y-2">
        <button className="btn w-full" onClick={check} disabled={busy}>
          {busy ? '…' : "I've confirmed"}
        </button>
        <button
          className="btn-ghost w-full"
          onClick={async () => {
            try {
              await resendVerification()
              setMsg('Sent again.')
            } catch (e) {
              setMsg(e instanceof Error ? e.message : 'Could not send.')
            }
          }}
        >
          Resend email
        </button>
        <button className="w-full pt-2 text-sm text-muted hover:text-cyan" onClick={logOut}>
          Sign out
        </button>
      </div>
    </AuthShell>
  )
}
