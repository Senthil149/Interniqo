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
    <div className="mx-auto max-w-md space-y-6 py-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm mb-3">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Sign In to Interniqo
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Enter your registered email and password to access your portal.
        </p>
      </div>

      <div className="card-base p-6 sm:p-8 shadow-sm">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800 space-y-2 animate-scale-in">
              <p className="font-bold flex items-center gap-1.5">
                <span>⚠️</span> {error}
              </p>
              {isUnverified && (
                <div className="pt-1 border-t border-rose-200/60">
                  <Link
                    to={`/verify-email?email=${encodeURIComponent(email.trim())}`}
                    className="font-bold text-blue-700 hover:text-blue-900 underline"
                  >
                    Enter your 6-digit verification code now →
                  </Link>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Email Address
            </label>
            <input
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              type="email"
              placeholder="you@domain.edu or you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password-input"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            className="btn-primary w-full py-2.5 text-sm mt-2"
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-4 text-center text-xs text-slate-500 border-t border-slate-100">
          Don&apos;t have an account yet?{' '}
          <Link className="font-bold text-blue-600 hover:text-blue-800 transition" to="/register">
            Register free →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
