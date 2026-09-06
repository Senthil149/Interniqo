import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApplications } from '../../api/applications.js'
import { getMyCredentials } from '../../api/credentials.js'

const STATUS_CONFIG = {
  APPLIED: {
    label: 'Applied',
    badge: 'bg-sky-100 text-sky-700 border-sky-200',
    description: 'Your application has been received and is waiting for initial company review.',
    stepIndex: 0,
  },
  SHORTLISTED: {
    label: 'Shortlisted',
    badge: 'bg-purple-100 text-purple-700 border-purple-200',
    description: 'Congratulations! You have been shortlisted by the company.',
    stepIndex: 1,
  },
  ACCEPTED: {
    label: 'Accepted',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    description: 'Offer accepted! You are confirmed for this internship.',
    stepIndex: 2,
  },
  REJECTED: {
    label: 'Not Selected',
    badge: 'bg-rose-100 text-rose-700 border-rose-200',
    description: 'The company decided not to proceed with this application.',
    stepIndex: 2,
  },
  COMPLETED: {
    label: 'Completed',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    description: 'Internship successfully completed! Ready for credential verification.',
    stepIndex: 3,
  },
}

function StatusStepper({ status }) {
  const isRejected = status === 'REJECTED'
  const currentStep = STATUS_CONFIG[status]?.stepIndex ?? 0

  const steps = [
    { label: 'Applied' },
    { label: 'Shortlisted' },
    { label: isRejected ? 'Declined' : 'Accepted' },
    { label: 'Completed' },
  ]

  return (
    <div className="py-2">
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const isDone = !isRejected ? idx <= currentStep : idx < currentStep
          const isCurrent = idx === currentStep
          const isFailed = isRejected && isCurrent

          return (
            <div key={step.label} className="flex flex-1 items-center last:flex-initial">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                    isFailed
                      ? 'bg-rose-600 text-white'
                      : isDone
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isFailed ? '✕' : isDone ? '✓' : idx + 1}
                </div>
                <span
                  className={`mt-1.5 text-[11px] font-medium ${
                    isFailed
                      ? 'text-rose-600 font-semibold'
                      : isCurrent
                      ? 'text-indigo-600 font-semibold'
                      : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {idx < steps.length - 1 && (
                <div
                  className={`mx-2 h-0.5 flex-1 transition ${
                    idx < currentStep && !isRejected ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState([])
  const [credentialsMap, setCredentialsMap] = useState({}) // { [internshipId]: credentialObj }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')

  useEffect(() => {
    loadApplications()
  }, [])

  async function loadApplications() {
    setLoading(true)
    setError('')
    try {
      const [appsRes, credsRes] = await Promise.all([
        getApplications(),
        getMyCredentials().catch(() => ({ data: [] })),
      ])
      setApplications(appsRes.data || [])

      const credMap = {}
      ;(credsRes.data || []).forEach((c) => {
        credMap[c.internshipId] = c
      })
      setCredentialsMap(credMap)
    } catch {
      setError('Unable to load your applications. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = applications.filter((app) => {
    if (filterStatus === 'ALL') return true
    return app.status === filterStatus
  })

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Applications</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track the status and progress of your submitted internship applications.
          </p>
        </div>

        <Link
          to="/student/internships"
          className="inline-flex items-center gap-2 self-start sm:self-auto rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
        >
          Browse More Internships →
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 text-xs">
        {['ALL', 'APPLIED', 'SHORTLISTED', 'ACCEPTED', 'REJECTED', 'COMPLETED'].map((status) => {
          const count =
            status === 'ALL'
              ? applications.length
              : applications.filter((a) => a.status === status).length

          return (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`rounded-full px-3 py-1 font-medium transition ${
                filterStatus === status
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'ALL' ? 'All Applications' : STATUS_CONFIG[status]?.label ?? status}{' '}
              <span className="opacity-75">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-40 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={loadApplications}
            className="font-semibold underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-slate-800">
            {filterStatus === 'ALL'
              ? 'No applications submitted yet'
              : `No applications with status "${STATUS_CONFIG[filterStatus]?.label ?? filterStatus}"`}
          </h2>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Explore verified opportunities across borders and submit your first internship application today.
          </p>
          <Link
            to="/student/internships"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
          >
            Explore Open Internships
          </Link>
        </div>
      )}

      {/* Applications list */}
      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((app) => {
            const config = STATUS_CONFIG[app.status] ?? {
              label: app.status,
              badge: 'bg-slate-100 text-slate-700',
              description: '',
            }

            return (
              <div
                key={app.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300"
              >
                {/* Top Row: Title, Company, Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <Link
                      to={`/internships/${app.internshipId}`}
                      className="text-lg font-bold text-slate-900 hover:text-indigo-600 transition"
                    >
                      {app.internshipTitle}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{app.companyName}</span>
                      <span>•</span>
                      <span>📍 {app.country}{app.city ? `, ${app.city}` : ''}</span>
                      <span>•</span>
                      <span>💼 {app.workMode}</span>
                      {app.stipend != null && (
                        <>
                          <span>•</span>
                          <span>💰 {app.stipend} {app.currency}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center self-start sm:self-auto rounded-full px-3 py-1 text-xs font-semibold border ${config.badge}`}
                  >
                    {config.label}
                  </span>
                </div>

                {/* Progress Stepper */}
                <div className="my-5 border-t border-b border-slate-100 py-3">
                  <StatusStepper status={app.status} />
                  <p className="mt-2 text-center text-xs text-slate-500 italic">
                    {config.description}
                  </p>

                  {/* Blockchain Credential Link if Issued */}
                  {credentialsMap[app.internshipId] && (
                    <div className="mt-4 flex items-center justify-center">
                      <Link
                        to={`/verify-credential/${encodeURIComponent(credentialsMap[app.internshipId].credentialId)}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-300 px-4 py-2 text-xs font-bold text-emerald-800 shadow-xs hover:bg-emerald-100 transition"
                      >
                        <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        View Verified Blockchain Credential ({credentialsMap[app.internshipId].credentialId}) →
                      </Link>
                    </div>
                  )}
                </div>

                {/* Footer Metadata */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                  <div className="space-x-4">
                    <span>
                      Applied:{' '}
                      <strong className="font-medium text-slate-600">
                        {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A'}
                      </strong>
                    </span>
                    <span>
                      Updated:{' '}
                      <strong className="font-medium text-slate-600">
                        {app.updatedAt ? new Date(app.updatedAt).toLocaleDateString() : 'N/A'}
                      </strong>
                    </span>
                  </div>

                  <Link
                    to={`/internships/${app.internshipId}`}
                    className="font-medium text-indigo-600 hover:text-indigo-800 transition"
                  >
                    View Internship Details →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
