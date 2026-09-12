import { useState, useEffect } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { resendCode } from '../api/auth.js'

function RegisterPage() {
  const { register, verifyCode, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Registration form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('STUDENT')
  const [companyName, setCompanyName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Step 2: Verification code state
  const [step, setStep] = useState('FORM') // 'FORM' | 'VERIFY'
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState('')
  const [resendStatus, setResendStatus] = useState(null) // { type: 'success' | 'error', text: string }
  const [resendCooldown, setResendCooldown] = useState(60)

  // Countdown timer for resend rate-limiting
  useEffect(() => {
    let timer = null
    if (step === 'VERIFY' && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0))
      }, 1000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [step, resendCooldown])

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleRegisterSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        companyName: role === 'COMPANY' ? companyName.trim() : undefined,
      })
      // Transition immediately to in-flow 6-digit verification code screen
      setStep('VERIFY')
      setResendCooldown(60)
      setCode('')
      setVerifyError('')
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Unable to register')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVerifySubmit(event) {
    event.preventDefault()
    const trimmedCode = code.trim()
    if (trimmedCode.length !== 6) {
      setVerifyError('Please enter the full 6-digit numeric verification code.')
      return
    }

    setVerifyError('')
    setVerifying(true)
    try {
      await verifyCode({
        email: email.trim().toLowerCase(),
        code: trimmedCode,
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setVerifyError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Invalid or expired verification code. Please check your code or request a new one.'
      )
    } finally {
      setVerifying(false)
    }
  }

  async function handleResendCode() {
    if (resendCooldown > 0) return

    setResendStatus(null)
    setVerifyError('')
    try {
      const { data } = await resendCode({ email: email.trim().toLowerCase() })
      setResendStatus({
        type: 'success',
        text: data?.message || 'A fresh 6-digit verification code has been sent to your email.',
      })
      setResendCooldown(60)
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Unable to resend verification code. Please try again.'
      setResendStatus({ type: 'error', text: errMsg })
    }
  }

  // STEP 2: In-flow 6-digit code verification view
  if (step === 'VERIFY') {
    return (
      <section className="mx-auto max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-xs ring-1 ring-indigo-100">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Verify your email</h1>
          <p className="mt-2 text-sm text-slate-600">
            We sent a 6-digit verification code to{' '}
            <span className="font-semibold text-slate-900">{email}</span>.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Please enter the code below to activate your account.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-5">
          {verifyError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 flex items-start gap-2.5">
              <svg className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{verifyError}</span>
            </div>
          ) : null}

          {resendStatus ? (
            <div
              className={`rounded-xl border p-3.5 text-xs flex items-start gap-2.5 ${
                resendStatus.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {resendStatus.type === 'success' ? (
                <svg className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span>{resendStatus.text}</span>
            </div>
          ) : null}

          <form className="space-y-5" onSubmit={handleVerifySubmit}>
            <div>
              <label htmlFor="verification-code-input" className="block text-center text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                6-Digit Verification Code
              </label>
              <input
                id="verification-code-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoFocus
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setCode(val)
                  if (verifyError) setVerifyError('')
                }}
                placeholder="••••••"
                className="w-full text-center font-mono text-3xl font-bold tracking-[0.4em] py-3.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition shadow-inner placeholder:text-slate-300"
              />
              <p className="mt-2 text-center text-xs text-slate-400">
                Code expires in 10 minutes.
              </p>
            </div>

            <button
              type="submit"
              disabled={verifying || code.trim().length !== 6}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifying ? 'Activating Account…' : 'Verify & Activate Account'}
            </button>
          </form>

          {/* Resend code section with cooldown */}
          <div className="pt-2 border-t border-slate-100 text-center space-y-3">
            <p className="text-xs text-slate-500">Didn’t receive the code or need a new one?</p>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resendCooldown > 0}
              className={`text-xs font-semibold transition ${
                resendCooldown > 0
                  ? 'text-slate-400 cursor-not-allowed'
                  : 'text-indigo-600 hover:text-indigo-700 underline'
              }`}
            >
              {resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : 'Resend 6-digit code'}
            </button>
          </div>

          {/* Design Rule #4 Disclaimer */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-[11px] text-slate-500 leading-relaxed text-center">
            <span className="font-semibold text-slate-700">Notice (Design Rule #4):</span> Email verification confirms control of this email address only. It does not certify legal company incorporation or academic standing.
          </div>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setStep('FORM')
                setVerifyError('')
                setResendStatus(null)
              }}
              className="text-xs text-slate-500 hover:text-slate-700 transition"
            >
              ← Change email address or details
            </button>
          </div>
        </div>
      </section>
    )
  }

  // STEP 1: Registration form
  return (
    <section className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create an account</h1>
        <p className="mt-1 text-sm text-slate-600">
          Sign up as a student or company. A 6-digit code will be sent to verify your email.
        </p>
      </div>

      <form className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm" onSubmit={handleRegisterSubmit}>
        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {error}
          </div>
        ) : null}

        <label className="block text-sm font-medium text-slate-700">
          Full Name
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            placeholder="e.g. Maya Lin"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Email address
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            type="email"
            placeholder="e.g. maya.lin@stanford.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Password
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            type="password"
            minLength={8}
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Account Role
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="STUDENT">Student (Apply & earn credentials)</option>
            <option value="COMPANY">Company (Post listings & hire)</option>
          </select>
        </label>

        {role === 'COMPANY' ? (
          <label className="block text-sm font-medium text-slate-700">
            Company Name
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              placeholder="e.g. Quantum Leap Technologies"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </label>
        ) : null}

        <button
          className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 disabled:opacity-60"
          type="submit"
          disabled={submitting}
        >
          {submitting ? 'Sending verification code…' : 'Register & Get Code'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-600">
        Already registered?{' '}
        <Link className="font-semibold text-indigo-600 hover:text-indigo-500 underline" to="/login">
          Sign in
        </Link>
      </p>
    </section>
  )
}

export default RegisterPage
