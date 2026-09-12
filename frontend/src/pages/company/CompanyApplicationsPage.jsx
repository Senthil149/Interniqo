import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApplications, updateApplicationStatus } from '../../api/applications.js'
import { getMyInternships } from '../../api/internships.js'
import { issueCredential, getMyCredentials } from '../../api/credentials.js'
import SkeletonLoader from '../../components/SkeletonLoader.jsx'

const STATUS_CONFIG = {
  APPLIED: {
    label: 'Applied',
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  SHORTLISTED: {
    label: 'Shortlisted',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  ACCEPTED: {
    label: 'Accepted',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  REJECTED: {
    label: 'Rejected',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  COMPLETED: {
    label: 'Completed',
    badge: 'bg-amber-50 text-amber-800 border-amber-300',
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
  const [actionError, setActionError] = useState(null)

  // Issued credentials: { [studentId_internshipId]: credentialObj }
  const [credentialsMap, setCredentialsMap] = useState({})
  const [issuingIds, setIssuingIds] = useState({})

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [appsRes, myInternshipsRes, credsRes] = await Promise.all([
        getApplications(),
        getMyInternships(),
        getMyCredentials().catch(() => ({ data: [] })),
      ])
      setApplications(appsRes.data || [])
      setInternships(myInternshipsRes.data || [])

      const credMap = {}
      ;(credsRes.data || []).forEach((c) => {
        credMap[`${c.studentId}_${c.internshipId}`] = c
      })
      setCredentialsMap(credMap)
    } catch {
      setError('Unable to load candidate applications. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleIssueCredential(applicationId, studentId, internshipId) {
    setIssuingIds((prev) => ({ ...prev, [applicationId]: true }))
    setActionError(null)

    try {
      const { data } = await issueCredential(applicationId)
      setCredentialsMap((prev) => ({
        ...prev,
        [`${studentId}_${internshipId}`]: data,
      }))
    } catch (err) {
      const msg =
        err.response?.data?.message || 'Failed to issue blockchain credential. Please ensure the local Hardhat node is running.'
      setActionError({ appId: applicationId, message: msg })
    } finally {
      setIssuingIds((prev) => ({ ...prev, [applicationId]: false }))
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
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Candidate Application Pipeline
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review candidate qualifications and progress through the hiring lifecycle: Applied → Shortlisted → Accepted → Completed.
          </p>
        </div>

        <Link
          to="/company/internships"
          className="btn-secondary text-xs self-start sm:self-auto"
        >
          Manage Listings →
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="card-base p-4 flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Filter by Internship */}
        <div className="flex-1">
          <label htmlFor="internship-filter" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Filter by Posting
          </label>
          <select
            id="internship-filter"
            value={selectedInternshipId}
            onChange={(e) => setSelectedInternshipId(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs shadow-2xs focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Status Filter
          </span>
          <div className="flex flex-wrap gap-1">
            {['ALL', 'APPLIED', 'SHORTLISTED', 'ACCEPTED', 'REJECTED', 'COMPLETED'].map(
              (status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white shadow-2xs'
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
          <SkeletonLoader variant="card" count={3} />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadData} className="font-bold underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div className="card-base flex flex-col items-center justify-center border-dashed py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-600 mb-3 shadow-xs">
            👥
          </div>
          <h2 className="font-heading text-base font-bold text-slate-800">
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
              badge: 'bg-slate-100 text-slate-700 border-slate-200',
            }

            return (
              <div
                key={app.id}
                className="card-base card-hover p-6 space-y-4"
              >
                {/* Top: Candidate info and target internship */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-base font-bold text-slate-900">
                        {app.studentName || 'Student Candidate'}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">({app.studentEmail})</span>
                    </div>

                    <p className="mt-1 text-xs text-blue-600 font-semibold">
                      Applied for:{' '}
                      <Link
                        to={`/internships/${app.internshipId}`}
                        className="underline hover:text-blue-800"
                      >
                        {app.internshipTitle}
                      </Link>{' '}
                      <span className="text-slate-500 font-normal">({app.country} • {app.workMode})</span>
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center self-start sm:self-auto rounded-full px-3 py-1 text-xs font-bold border ${config.badge}`}
                  >
                    {config.label}
                  </span>
                </div>

                {/* Candidate qualifications preview */}
                <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 sm:grid-cols-2 text-xs">
                  <div>
                    <span className="font-bold text-slate-700 block mb-0.5">Education</span>
                    <span className="text-slate-600">
                      {app.studentEducation || 'No education listed'}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-700 block mb-0.5">Skills</span>
                    <span className="text-slate-600">
                      {app.studentSkills || 'No skills listed'}
                    </span>
                  </div>
                </div>

                {/* Status action transition toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <div className="text-xs text-slate-400">
                    Applied {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A'} •
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
                          className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer"
                        >
                          Shortlist Candidate
                        </button>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleStatusChange(app.id, 'ACCEPTED')}
                          className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 disabled:opacity-50 transition cursor-pointer"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleStatusChange(app.id, 'REJECTED')}
                          className="rounded-xl border border-rose-300 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50 transition cursor-pointer"
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
                          className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 disabled:opacity-50 transition cursor-pointer"
                        >
                          Accept Candidate
                        </button>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleStatusChange(app.id, 'REJECTED')}
                          className="rounded-xl border border-rose-300 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50 transition cursor-pointer"
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
                        className="btn-accent text-xs py-1.5 px-3"
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
                      <div className="flex flex-wrap items-center gap-2">
                        {credentialsMap[`${app.studentId}_${app.internshipId}`] ? (
                          <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5">
                            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                              Credential Minted
                            </span>
                            <Link
                              to={`/verify-credential/${encodeURIComponent(credentialsMap[`${app.studentId}_${app.internshipId}`].credentialId)}`}
                              target="_blank"
                              className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
                            >
                              Verify ({credentialsMap[`${app.studentId}_${app.internshipId}`].credentialId})
                            </Link>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={issuingIds[app.id]}
                            onClick={() => handleIssueCredential(app.id, app.studentId, app.internshipId)}
                            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                          >
                            {issuingIds[app.id] ? (
                              <>
                                <svg className="h-3.5 w-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z" />
                                </svg>
                                <span>Minting on Ledger…</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <span>Issue Blockchain Credential</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* In-line error message */}
                {hasError && (
                  <div className="mt-2 text-xs font-semibold text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
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
