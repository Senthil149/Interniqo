import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { getInternship } from '../../api/internships.js'
import { applyToInternship, checkApplication } from '../../api/applications.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import RiskBadge from '../../components/RiskBadge.jsx'
import CompanyVerificationBadge from '../../components/CompanyVerificationBadge.jsx'
import SkeletonLoader from '../../components/SkeletonLoader.jsx'

const WORK_MODE_COLORS = {
  REMOTE: 'bg-sky-50 text-sky-700 border-sky-200',
  HYBRID: 'bg-blue-50 text-blue-700 border-blue-200',
  ONSITE: 'bg-amber-50 text-amber-700 border-amber-200',
}

const STATUS_COLORS = {
  APPLIED: 'bg-sky-50 text-sky-700 border-sky-200',
  SHORTLISTED: 'bg-purple-50 text-purple-700 border-purple-200',
  ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
  COMPLETED: 'bg-amber-50 text-amber-700 border-amber-200',
}

function Field({ label, value }) {
  if (value == null || value === '') return null
  return (
    <div className="space-y-1">
      <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className="whitespace-pre-wrap text-sm text-slate-800 leading-relaxed">{value}</dd>
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
      <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
        <div className="h-6 w-24 rounded bg-slate-200 animate-pulse" />
        <SkeletonLoader variant="detail-header" count={1} />
        <div className="card-base animate-pulse h-40" />
      </div>
    )
  }

  if (error || !internship) {
    return (
      <div className="mx-auto max-w-3xl card-base text-center py-12">
        <p className="text-slate-600 font-medium">{error || 'Internship not found.'}</p>
        <button
          onClick={() => navigate(-1)}
          className="btn-secondary text-xs mt-4"
        >
          ← Return to listings
        </button>
      </div>
    )
  }

  const workModeClass =
    WORK_MODE_COLORS[internship.workMode] ?? 'bg-slate-100 text-slate-600 border-slate-200'

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      {/* Back navigation */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-slate-900 cursor-pointer"
      >
        <span>←</span>
        <span>Back to listings</span>
      </button>

      {/* Main card */}
      <div className="card-base p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
              {internship.title}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
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
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                internship.status === 'OPEN'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {internship.status}
            </span>
          </div>
        </div>

        {/* Quick-facts strip */}
        <div className="flex flex-wrap gap-2.5 pt-2">
          <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${workModeClass}`}>
            {internship.workMode}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            📍 {internship.country}{internship.city ? `, ${internship.city}` : ''}
          </span>
          {internship.duration && (
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              ⏱ {internship.duration}
            </span>
          )}
          {internship.stipend != null && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              💰 {internship.stipend} {internship.currency ?? ''} / month
            </span>
          )}
          {internship.deadline && (
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              📅 Deadline: {internship.deadline}
            </span>
          )}
        </div>

        <hr className="border-slate-100" />

        {/* Details */}
        <dl className="space-y-6">
          <Field label="Program Overview" value={internship.description} />
          <Field label="Key Skills & Qualifications" value={internship.requiredSkills} />
          <Field label="Candidate Eligibility" value={internship.eligibility} />
          <Field label="Work Authorization & Visa Support" value={internship.visaInformation} />
        </dl>
      </div>

      {/* Application Action Section */}
      <div className="card-base p-6">
        {isAuthenticated && user?.role === 'STUDENT' ? (
          <div>
            {application ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-sm font-bold text-slate-900">Application Submitted</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                        STATUS_COLORS[application.status] ?? 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {application.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Received on{' '}
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
                  className="btn-secondary text-xs shrink-0"
                >
                  Track Application Status →
                </Link>
              </div>
            ) : (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="font-heading text-base font-bold text-slate-900">Submit Your Application</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Your parsed resume skills and contact profile will be delivered directly to {internship.companyName}.
                    </p>
                  </div>

                  {internship.status === 'OPEN' ? (
                    <button
                      type="button"
                      onClick={handleApply}
                      disabled={applying || checkingApp}
                      className="btn-primary shrink-0"
                    >
                      {applying ? (
                        <>
                          <svg className="h-4 w-4 animate-spin text-white mr-2" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          Submitting…
                        </>
                      ) : (
                        'Apply Now'
                      )}
                    </button>
                  ) : (
                    <span className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-medium text-slate-500">
                      Applications Closed
                    </span>
                  )}
                </div>

                {applySuccess && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 animate-scale-in">
                    🎉 Application submitted successfully! You can track your evaluation on the{' '}
                    <Link to="/student/applications" className="font-bold underline">
                      My Applications
                    </Link>{' '}
                    page.
                  </div>
                )}

                {applyError && (
                  <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 animate-scale-in">
                    {applyError}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : !isAuthenticated ? (
          <div className="text-center py-3 space-y-2">
            <p className="text-sm text-slate-700 font-medium">Interested in applying for this role?</p>
            <Link
              to="/login"
              state={{ from: location }}
              className="btn-primary text-xs"
            >
              Sign In to Apply
            </Link>
          </div>
        ) : (
          <div className="text-center py-1">
            <p className="text-xs text-slate-400">
              You are viewing this internship in preview mode (Corporate Recruiter Account).
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default InternshipDetailPage
