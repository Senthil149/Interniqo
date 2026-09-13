import { useState, useEffect } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../auth/AuthContext.jsx'
import { resendCode } from '../api/auth.js'
import AnimatedInput from '../components/AnimatedInput.jsx'
import { MotionButton } from '../components/MotionButton.jsx'

function RegisterPage() {
  const { register, verifyCode, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Registration form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('STUDENT')
  const [companyName, setCompanyName] = useState('')
  const [website, setWebsite] = useState('')
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
        website: role === 'COMPANY' && website.trim() ? website.trim() : undefined,
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

  // STEP 2: In-flow 6-digit code verification view (Category 6: scale 0.9->1 and fade entrance)
  if (step === 'VERIFY') {
    return (
      <div className="mx-auto max-w-md space-y-6 py-6 animate-fade-in">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 shadow-xs ring-1 ring-primary-100 mb-3">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Verify your email</h1>
          <p className="text-xs sm:text-sm text-slate-600">
            We sent a 6-digit verification code to{' '}
            <span className="font-semibold text-slate-900 font-mono">{email}</span>.
          </p>
          <p className="text-xs text-slate-400">
            Please enter the code below to activate your account.
          </p>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="card-base p-6 sm:p-8 space-y-5 shadow-sm"
        >
          <AnimatePresence>
            {verifyError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-2xl border border-danger-200 bg-danger-50 p-3.5 text-xs text-danger-700 flex items-start gap-2.5"
              >
                <span className="text-danger-500 font-bold">⚠️</span>
                <span>{verifyError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {resendStatus && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border p-3.5 text-xs flex items-start gap-2.5 ${
                resendStatus.type === 'success'
                  ? 'border-success-200 bg-success-50 text-success-800'
                  : 'border-danger-200 bg-danger-50 text-danger-700'
              }`}
            >
              <span>{resendStatus.type === 'success' ? '✅' : '⚠️'}</span>
              <span>{resendStatus.text}</span>
            </motion.div>
          )}

          <form className="space-y-5" onSubmit={handleVerifySubmit}>
            <div>
              <label htmlFor="verification-code-input" className="block text-center text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                6-Digit Verification Code
              </label>
              <motion.div
                animate={verifyError ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
              >
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
                  className="w-full text-center font-mono text-3xl font-bold tracking-[0.4em] py-3.5 rounded-xl border border-warm-border bg-slate-50/50 text-slate-900 transition focus:border-primary-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-600/20 shadow-inner placeholder:text-slate-300"
                />
              </motion.div>
              <p className="mt-2 text-center text-xs text-slate-400">
                Code expires in 10 minutes.
              </p>
            </div>

            <MotionButton
              type="submit"
              disabled={verifying || code.trim().length !== 6}
              className="btn-primary w-full py-3 text-sm"
              pulse={code.trim().length === 6}
            >
              {verifying ? 'Activating Account…' : 'Verify & Activate Account'}
            </MotionButton>
          </form>

          {/* Resend code section with cooldown */}
          <div className="pt-2 border-t border-slate-100 text-center space-y-2">
            <p className="text-xs text-slate-500">Didn’t receive the code or need a new one?</p>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resendCooldown > 0}
              className={`text-xs font-bold transition cursor-pointer ${
                resendCooldown > 0
                  ? 'text-slate-400 cursor-not-allowed'
                  : 'text-primary-700 hover:text-primary-900 underline'
              }`}
            >
              {resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : 'Resend 6-digit code'}
            </button>
          </div>

          {/* Verification Disclaimer */}
          <div className="rounded-xl border border-warm-border bg-warm-bg/50 p-3 text-[11px] text-slate-500 leading-relaxed text-center">
            <span className="font-semibold text-slate-700">Notice:</span> Email verification confirms control of this email address only. It does not certify legal company incorporation or academic standing.
          </div>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setStep('FORM')
                setVerifyError('')
                setResendStatus(null)
              }}
              className="text-xs text-slate-500 hover:text-slate-700 transition cursor-pointer"
            >
              ← Change email address or details
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // STEP 1: Registration form
  return (
    <div className="mx-auto max-w-md space-y-6 py-6 animate-fade-in">
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-700 text-white shadow-sm mb-3"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </motion.div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Create an Account
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Sign up as a student or recruiter. A secure 6-digit verification code will be issued.
        </p>
      </div>

      <motion.div
        animate={error ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        className="card-base p-6 sm:p-8 shadow-sm"
      >
        <form className="space-y-4" onSubmit={handleRegisterSubmit}>
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="rounded-xl border border-danger-200 bg-danger-50 p-3.5 text-xs text-danger-700"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatedInput
            id="register-name"
            name="name"
            label="Full Name"
            placeholder="e.g. Maya Lin"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <AnimatedInput
            id="register-email"
            name="email"
            type="email"
            label="Email Address"
            placeholder="e.g. maya.lin@stanford.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <AnimatedInput
            id="register-password"
            name="password"
            type="password"
            label="Password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />

          <div className="space-y-1.5">
            <label htmlFor="account-role-select" className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Account Role
            </label>
            <select
              id="account-role-select"
              className="input-field border-warm-border focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="STUDENT">Student (Apply &amp; earn credentials)</option>
              <option value="COMPANY">Company (Post listings &amp; hire)</option>
            </select>
          </div>

          <AnimatePresence>
            {role === 'COMPANY' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-4 pt-2 border-t border-slate-100 overflow-hidden"
              >
                <AnimatedInput
                  id="company-name"
                  name="companyName"
                  label="Company / Organization Name"
                  placeholder="e.g. Quantum Leap Technologies"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />

                <div className="space-y-1">
                  <AnimatedInput
                    id="company-website"
                    name="website"
                    label="Company Website (Optional)"
                    placeholder="e.g. https://quantumleap.tech"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                  <span className="block text-xs text-slate-500">
                    If provided, we verify whether your work email domain matches your company website host.
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <MotionButton
            className="btn-primary w-full py-2.5 text-sm mt-2"
            type="submit"
            disabled={submitting}
            pulse={false}
          >
            {submitting ? 'Sending verification code…' : 'Register & Get Code'}
          </MotionButton>
        </form>

        <p className="mt-6 pt-4 text-center text-xs text-slate-500 border-t border-slate-100">
          Already registered?{' '}
          <Link className="font-bold text-primary-700 hover:text-primary-900 transition" to="/login">
            Sign in →
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

export default RegisterPage
