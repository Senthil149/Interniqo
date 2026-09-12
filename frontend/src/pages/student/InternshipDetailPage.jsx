import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { getInternship } from '../../api/internships.js'
import { applyToInternship, checkApplication } from '../../api/applications.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import RiskBadge from '../../components/RiskBadge.jsx'
import CompanyVerificationBadge from '../../components/CompanyVerificationBadge.jsx'

const WORK_MODE_COLORS = {
  REMOTE: 'bg-sky-100 text-sky-700',
  HYBRID: 'bg-violet-100 text-violet-700',
  ONSITE: 'bg-amber-100 text-amber-700',
}

const STATUS_COLORS = {
  APPLIED: 'bg-sky-100 text-sky-700 border-sky-200',
  SHORTLISTED: 'bg-purple-100 text-purple-700 border-purple-200',
  ACCEPTED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-rose-100 text-rose-700 border-rose-200',
  COMPLETED: 'bg-amber-100 text-amber-700 border-amber-200',
}

function Field({ label, value }) {
  if (value == null || value === '') return null
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{value}</dd>
    </div>
  )
}

function InternshipDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()

  const [internship, setInternship] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [application, setApplication] = useState(null)
  const [checkingApp, setCheckingApp] = useState(false)
  const [applying, setApplying] = useState(false)
  const [applyError, setApplyError] = useState('')
  const [applySuccess, setApplySuccess] = useState(false)

  useEffect(() => {
    getInternship(id)
      .then(({ data }) => setInternship(data))
      .catch(() => setError('Internship not found or could not be loaded.'))
      .finally(() => setLoading(false))

    if (isAuthenticated && user?.role === 'STUDENT') {
      setCheckingApp(true)
      checkApplication(id)
        .then(({ data }) => {
          if (data && data.id) {
            setApplication(data)
          }
        })
        .catch(() => {})
        .finally(() => setCheckingApp(false))
    }
  }, [id, isAuthenticated, user?.role])

  async function handleApply() {
    if (applying || application) return
    setApplying(true)
    setApplyError('')
    setApplySuccess(false)

    try {
      const { data } = await applyToInternship(id)
      setApplication(data)
      setApplySuccess(true)
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit application. Please try again.'
      setApplyError(msg)
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-100" />
        <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
      </div>
    )
  }

  if (error || !internship) {
    return (
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-slate-500">{error || 'Internship not found.'}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-sm text-indigo-600 hover:underline"
        >
          ← Go back
        </button>
      </div>
    )
  }

  const workModeClass =
    WORK_MODE_COLORS[internship.workMode] ?? 'bg-slate-100 text-slate-600'

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back navigation */}
      <button
        onClick={() => navigate(-1)}
        className="text-sm font-medium text-slate-500 transition hover:text-slate-800"
      >
        ← Back
      </button>

      {/* Main card */}
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{internship.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold text-slate-700">{internship.companyName}</span>
              <CompanyVerificationBadge
                verified={internship.companyEmailVerified}
                personalEmail={internship.companyPersonalEmail}
                websiteDomainMatch={internship.companyWebsiteDomainMatch}
                website={internship.companyWebsite}
                showWebsiteLink={true}
                size="md"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <RiskBadge
              level={internship.riskLevel}
              score={internship.riskScore}
              reasons={internship.riskReasons}
              internshipId={internship.id}
            />
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                internship.status === 'OPEN'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {internship.status}
            </span>
          </div>
        </div>

        {/* Quick-facts strip */}
        <div className="mb-6 flex flex-wrap gap-3">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${workModeClass}`}
          >
            {internship.workMode}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            📍 {internship.country}
            {internship.city ? `, ${internship.city}` : ''}
          </span>
          {internship.duration && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              ⏱ {internship.duration}
            </span>
          )}
          {internship.stipend != null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              💰 {internship.stipend} {internship.currency ?? ''}
            </span>
          )}
          {internship.deadline && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              📅 Deadline: {internship.deadline}
            </span>
          )}
        </div>

        <hr className="mb-6 border-slate-100" />

        {/* Details */}
        <dl className="space-y-5">
          <Field label="Description" value={internship.description} />
          <Field label="Required Skills" value={internship.requiredSkills} />
          <Field label="Eligibility" value={internship.eligibility} />
          <Field label="Visa Information" value={internship.visaInformation} />
        </dl>
      </div>

      {/* Application Action Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {isAuthenticated && user?.role === 'STUDENT' ? (
          <div>
            {application ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">Application Submitted</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                        STATUS_COLORS[application.status] ?? 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {application.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    You submitted your application on{' '}
                    {application.appliedAt
                      ? new Date(application.appliedAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'recently'}
                    .
                  </p>
                </div>

                <Link
                  to="/student/applications"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shrink-0"
                >
                  Track Application Status →
                </Link>
              </div>
            ) : (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Apply for this Internship</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Submit your application directly to {internship.companyName}.
                    </p>
                  </div>

                  {internship.status === 'OPEN' ? (
                    <button
                      type="button"
                      onClick={handleApply}
                      disabled={applying || checkingApp}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition shrink-0"
                    >
                      {applying ? (
                        <>
                          <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          Submitting...
                        </>
                      ) : (
                        'Apply Now'
                      )}
                    </button>
                  ) : (
                    <span className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-medium text-slate-500">
                      Applications Closed
                    </span>
                  )}
                </div>

                {applySuccess && (
                  <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                    🎉 Application submitted successfully! You can track your progress on the{' '}
                    <Link to="/student/applications" className="font-semibold underline">
                      My Applications
                    </Link>{' '}
                    page.
                  </div>
                )}

                {applyError && (
                  <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                    {applyError}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : !isAuthenticated ? (
          <div className="text-center py-2">
            <p className="text-sm text-slate-600">Interested in this opportunity?</p>
            <Link
              to="/login"
              state={{ from: location }}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition"
            >
              Sign In to Apply
            </Link>
          </div>
        ) : (
          <div className="text-center py-1">
            <p className="text-xs text-slate-400">
              You are viewing this internship in preview mode (Company account).
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default InternshipDetailPage
