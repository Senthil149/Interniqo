import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'

function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [isUnverified, setIsUnverified] = useState(false)

  if (isAuthenticated) {
    return <Navigate to={location.state?.from?.pathname || '/dashboard'} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsUnverified(false)
    setSubmitting(true)
    try {
      await login({ email, password })
    } catch (err) {
      const status = err.response?.status
      const msg = err.response?.data?.message || err.response?.data?.error || 'Unable to sign in'
      setError(msg)
      if (status === 403 || msg.toLowerCase().includes('not been verified')) {
        setIsUnverified(true)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-slate-600">Use the account you registered with this platform.</p>
      </div>
      <form className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 space-y-2">
            <p>{error}</p>
            {isUnverified && (
              <div className="pt-1">
                <Link
                  to={`/verify-email?email=${encodeURIComponent(email.trim())}`}
                  className="font-semibold text-indigo-600 hover:text-indigo-700 underline"
                >
                  Enter your 6-digit verification code now →
                </Link>
              </div>
            )}
          </div>
        ) : null}
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password-input" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-500 transition"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password-input"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          type="submit"
          disabled={submitting}
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="text-sm text-slate-600">
        No account yet?{' '}
        <Link className="font-medium text-slate-900 underline" to="/register">
          Register
        </Link>
      </p>
    </section>
  )
}

export default LoginPage
