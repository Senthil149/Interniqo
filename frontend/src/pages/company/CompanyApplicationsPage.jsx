import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApplications, updateApplicationStatus } from '../../api/applications.js'
import { getMyInternships } from '../../api/internships.js'

const STATUS_CONFIG = {
  APPLIED: {
    label: 'Applied',
    badge: 'bg-sky-100 text-sky-700 border-sky-200',
  },
  SHORTLISTED: {
    label: 'Shortlisted',
    badge: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  ACCEPTED: {
    label: 'Accepted',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  REJECTED: {
    label: 'Rejected',
    badge: 'bg-rose-100 text-rose-700 border-rose-200',
  },
  COMPLETED: {
    label: 'Completed',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
  },
}

export default function CompanyApplicationsPage() {
  const [applications, setApplications] = useState([])
  const [internships, setInternships] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [selectedInternshipId, setSelectedInternshipId] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // In-flight status update tracking: { [appId]: boolean }
  const [updatingIds, setUpdatingIds] = useState({})
  const [actionError, setActionError] = useState(null) // { appId, message }

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [appsRes, myInternshipsRes] = await Promise.all([
        getApplications(),
        getMyInternships(),
      ])
      setApplications(appsRes.data || [])
      setInternships(myInternshipsRes.data || [])
    } catch {
      setError('Unable to load candidate applications. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(applicationId, newStatus) {
    setUpdatingIds((prev) => ({ ...prev, [applicationId]: true }))
    setActionError(null)

    try {
      const { data } = await updateApplicationStatus(applicationId, newStatus)
      setApplications((prev) =>
        prev.map((app) => (app.id === applicationId ? data : app))
      )
    } catch (err) {
      const msg =
        err.response?.data?.message || 'Failed to update application status. Please try again.'
      setActionError({ appId: applicationId, message: msg })
    } finally {
      setUpdatingIds((prev) => ({ ...prev, [applicationId]: false }))
    }
  }

  const filtered = applications.filter((app) => {
    if (selectedInternshipId && app.internshipId !== Number(selectedInternshipId)) {
      return false
    }
    if (statusFilter !== 'ALL' && app.status !== statusFilter) {
      return false
    }
    return true
  })

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Application Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review candidates and advance them through the hiring lifecycle: APPLIED → SHORTLISTED → ACCEPTED/REJECTED → COMPLETED.
          </p>
        </div>

        <Link
          to="/company/internships"
          className="inline-flex items-center gap-2 self-start sm:self-auto rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
        >
          Manage Listings →
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        {/* Filter by Internship */}
        <div className="flex-1">
          <label htmlFor="internship-filter" className="block text-xs font-semibold text-slate-700">
            Filter by Internship Posting
          </label>
          <select
            id="internship-filter"
            value={selectedInternshipId}
            onChange={(e) => setSelectedInternshipId(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs shadow-xs focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Internship Postings ({internships.length})</option>
            {internships.map((inItem) => (
              <option key={inItem.id} value={inItem.id}>
                {inItem.title} ({inItem.country} • {inItem.status})
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Status */}
        <div className="sm:w-80">
          <span className="block text-xs font-semibold text-slate-700 mb-1">
            Status Stage
          </span>
          <div className="flex flex-wrap gap-1">
            {['ALL', 'APPLIED', 'SHORTLISTED', 'ACCEPTED', 'REJECTED', 'COMPLETED'].map(
              (status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                    statusFilter === status
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadData} className="font-semibold underline hover:no-underline">
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-slate-800">
            {applications.length === 0
              ? 'No applications received yet'
              : 'No applications match your filter selection'}
          </h2>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Candidates who apply to your published internships will appear here for review and status updates.
          </p>
        </div>
      )}

      {/* Candidate Applications List */}
      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((app) => {
            const isUpdating = Boolean(updatingIds[app.id])
            const hasError = actionError?.appId === app.id
            const config = STATUS_CONFIG[app.status] ?? {
              label: app.status,
              badge: 'bg-slate-100 text-slate-700',
            }

            return (
              <div
                key={app.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300"
              >
                {/* Top: Candidate info and target internship */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-slate-900">
                        {app.studentName || 'Student Candidate'}
                      </span>
                      <span className="text-xs text-slate-500">({app.studentEmail})</span>
                    </div>

                    <p className="mt-1 text-xs text-indigo-600 font-medium">
                      Applied for:{' '}
                      <Link
                        to={`/internships/${app.internshipId}`}
                        className="underline hover:text-indigo-800"
                      >
                        {app.internshipTitle}
                      </Link>{' '}
                      ({app.country} • {app.workMode})
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center self-start sm:self-auto rounded-full px-3 py-1 text-xs font-semibold border ${config.badge}`}
                  >
                    {config.label}
                  </span>
                </div>

                {/* Candidate qualifications preview */}
                <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3 sm:grid-cols-2 text-xs">
                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">Education</span>
                    <span className="text-slate-600">
                      {app.studentEducation || 'No education listed'}
                    </span>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">Skills</span>
                    <span className="text-slate-600">
                      {app.studentSkills || 'No skills listed'}
                    </span>
                  </div>
                </div>

                {/* Status action transition toolbar */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <div className="text-xs text-slate-400">
                    Applied on {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A'} •
                    Last update: {app.updatedAt ? new Date(app.updatedAt).toLocaleTimeString() : 'N/A'}
                  </div>

                  {/* Transition action buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* State: APPLIED */}
                    {app.status === 'APPLIED' && (
                      <>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleStatusChange(app.id, 'SHORTLISTED')}
                          className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-purple-700 disabled:opacity-50 transition"
                        >
                          Shortlist Candidate
                        </button>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleStatusChange(app.id, 'ACCEPTED')}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleStatusChange(app.id, 'REJECTED')}
                          className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50 transition"
                        >
                          Decline
                        </button>
                      </>
                    )}

                    {/* State: SHORTLISTED */}
                    {app.status === 'SHORTLISTED' && (
                      <>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleStatusChange(app.id, 'ACCEPTED')}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition"
                        >
                          Accept Candidate
                        </button>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleStatusChange(app.id, 'REJECTED')}
                          className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50 transition"
                        >
                          Decline
                        </button>
                      </>
                    )}

                    {/* State: ACCEPTED */}
                    {app.status === 'ACCEPTED' && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleStatusChange(app.id, 'COMPLETED')}
                        className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 disabled:opacity-50 transition"
                      >
                        Mark Internship as Completed
                      </button>
                    )}

                    {/* Terminal states */}
                    {app.status === 'REJECTED' && (
                      <span className="text-xs text-slate-400 italic">
                        Application closed (Declined)
                      </span>
                    )}

                    {app.status === 'COMPLETED' && (
                      <span className="text-xs text-amber-700 font-medium">
                        ✓ Completed • Ready for credential issuance
                      </span>
                    )}
                  </div>
                </div>

                {/* In-line error message */}
                {hasError && (
                  <div className="mt-2 text-xs text-rose-600">
                    {actionError.message}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
