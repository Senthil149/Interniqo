import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getApplications } from '../../api/applications.js'
import { getMyCredentials } from '../../api/credentials.js'
import SkeletonLoader from '../../components/SkeletonLoader.jsx'
import Modal from '../../components/Modal.jsx'
import { MotionButton } from '../../components/MotionButton.jsx'

const STATUS_CONFIG = {
  APPLIED: {
    label: 'Applied',
    badge: 'bg-teal-50 text-teal-700 border-teal-200',
    description: 'Your application has been received and is waiting for initial company review.',
    stepIndex: 0,
  },
  SHORTLISTED: {
    label: 'Shortlisted',
    badge: 'bg-primary-50 text-primary-700 border-primary-200',
    description: 'Congratulations! You have been shortlisted for further technical/HR review.',
    stepIndex: 1,
  },
  ACCEPTED: {
    label: 'Accepted',
    badge: 'bg-success-50 text-success-700 border-success-200',
    description: 'Offer accepted! You are confirmed for this internship position.',
    stepIndex: 2,
  },
  REJECTED: {
    label: 'Not Selected',
    badge: 'bg-danger-50 text-danger-700 border-danger-200',
    description: 'The recruiting team decided not to proceed with this application.',
    stepIndex: 2,
  },
  COMPLETED: {
    label: 'Completed',
    badge: 'bg-accent-50 text-accent-800 border-accent-300',
    description: 'Internship successfully completed! Verified on-chain credential ready.',
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
    <div className="py-3">
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const isDone = !isRejected ? idx <= currentStep : idx < currentStep
          const isCurrent = idx === currentStep
          const isFailed = isRejected && isCurrent

          return (
            <div key={step.label} className="flex flex-1 items-center last:flex-initial">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition shadow-xs ${
                    isFailed
                      ? 'bg-danger-600 text-white ring-4 ring-danger-100'
                      : isDone
                      ? 'bg-primary-700 text-white ring-4 ring-primary-50'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isFailed ? '✕' : isDone ? '✓' : idx + 1}
                </div>
                <span
                  className={`mt-1.5 text-[11px] font-medium ${
                    isFailed
                      ? 'text-danger-600 font-bold'
                      : isCurrent
                      ? 'text-primary-700 font-bold'
                      : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {idx < steps.length - 1 && (
                <div
                  className={`mx-2 h-1 flex-1 rounded-full transition ${
                    idx < currentStep && !isRejected ? 'bg-primary-700' : 'bg-slate-200'
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
  const [activeCredentialModal, setActiveCredentialModal] = useState(null)

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
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            My Applications
          </h1>
          <p className="mt-1 text-sm text-slate-500 max-w-xl">
            Track hiring progress from initial submission to final completion certificate issuance.
          </p>
        </div>

        <Link
          to="/student/internships"
          className="btn-primary text-xs self-start sm:self-auto"
        >
          Browse Open Positions →
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 text-xs">
        {['ALL', 'APPLIED', 'SHORTLISTED', 'ACCEPTED', 'REJECTED', 'COMPLETED'].map((status) => {
          const count =
            status === 'ALL'
              ? applications.length
              : applications.filter((a) => a.status === status).length

          return (
            <motion.button
              key={status}
              type="button"
              whileTap={{ scale: 0.95 }}
              whileHover={{ y: -1 }}
              onClick={() => setFilterStatus(status)}
              className={`rounded-full px-3.5 py-1.5 font-semibold transition cursor-pointer ${
                filterStatus === status
                  ? 'bg-primary-700 text-white shadow-xs'
                  : 'bg-white border border-warm-border text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {status === 'ALL' ? 'All Applications' : STATUS_CONFIG[status]?.label ?? status}{' '}
              <span className="opacity-80">({count})</span>
            </motion.button>
          )
        })}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          <SkeletonLoader variant="card" count={3} />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-2xl border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div className="card-base text-center py-14 px-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-400 mb-3 shadow-xs">
            📋
          </div>
          <h2 className="font-heading text-lg font-bold text-slate-900">
            {filterStatus === 'ALL' ? 'No applications submitted yet' : `No ${STATUS_CONFIG[filterStatus]?.label.toLowerCase()} applications`}
          </h2>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Explore verified opportunities across borders and submit your first internship application today.
          </p>
          <Link
            to="/student/internships"
            className="btn-primary text-xs mt-4"
          >
            Explore Open Internships
          </Link>
        </div>
      )}

      {/* Applications list with layout reordering animations (Category 3) */}
      {!loading && !error && filtered.length > 0 && (
        <motion.div layout className="space-y-4">
          <AnimatePresence>
            {filtered.map((app) => {
              const config = STATUS_CONFIG[app.status] ?? {
                label: app.status,
                badge: 'bg-slate-100 text-slate-700 border-slate-200',
                description: '',
              }

              return (
                <motion.div
                  layout
                  key={app.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  whileHover={{ y: -2 }}
                  className="card-base card-hover p-6 space-y-4"
                >
                  {/* Top Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <Link
                        to={`/internships/${app.internshipId}`}
                        className="font-heading text-lg font-bold text-slate-900 hover:text-primary-700 transition"
                      >
                        {app.internshipTitle}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">{app.companyName}</span>
                        <span>•</span>
                        <span>📍 {app.country}{app.city ? `, ${app.city}` : ''}</span>
                        <span>•</span>
                        <span className="font-medium text-slate-600">{app.workMode}</span>
                        {app.stipend != null && (
                          <>
                            <span>•</span>
                            <span className="font-semibold text-success-700">💰 {app.stipend} {app.currency}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center self-start sm:self-auto rounded-full px-3 py-1 text-xs font-bold border ${config.badge}`}
                    >
                      {config.label}
                    </span>
                  </div>

                  {/* Progress Stepper */}
                  <div className="my-2 border-t border-b border-slate-100 py-3">
                    <StatusStepper status={app.status} />
                    <p className="mt-2 text-center text-xs text-slate-500 italic">
                      {config.description}
                    </p>

                    {/* Blockchain Credential Link if Issued (Category 6: Credential Result Dialog) */}
                    {credentialsMap[app.internshipId] && (
                      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                        <MotionButton
                          type="button"
                          onClick={() => setActiveCredentialModal({
                            ...credentialsMap[app.internshipId],
                            internshipTitle: app.internshipTitle,
                            companyName: app.companyName,
                          })}
                          className="inline-flex items-center gap-2 rounded-xl bg-success-50 border border-success-300 px-4 py-2 text-xs font-bold text-success-800 shadow-xs hover:bg-success-100 transition cursor-pointer"
                        >
                          <svg className="w-4 h-4 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          <span>View Verified Credential ({credentialsMap[app.internshipId].credentialId}) →</span>
                        </MotionButton>
                      </div>
                    )}
                  </div>

                  {/* Footer Metadata */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-1">
                    <div className="space-x-3">
                      <span>
                        Applied:{' '}
                        <strong className="font-semibold text-slate-600">
                          {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A'}
                        </strong>
                      </span>
                      <span>
                        Updated:{' '}
                        <strong className="font-semibold text-slate-600">
                          {app.updatedAt ? new Date(app.updatedAt).toLocaleDateString() : 'N/A'}
                        </strong>
                      </span>
                    </div>

                    <Link
                      to={`/internships/${app.internshipId}`}
                      className="font-semibold text-primary-700 hover:text-primary-800 transition"
                    >
                      View Internship Details →
                    </Link>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Category 6: Credential Result Dialog Modal with scale 0.9->1 and fade entrance */}
      <Modal
        isOpen={Boolean(activeCredentialModal)}
        onClose={() => setActiveCredentialModal(null)}
        title="Verified Internship Credential"
      >
        {activeCredentialModal && (
          <div className="space-y-4">
            <div className="rounded-xl border border-success-200 bg-success-50 p-4 text-xs text-success-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-sm text-success-800">
                <span>🛡️</span> Verified Completion Credential
              </p>
              <p className="text-success-700">
                This credential was permanently registered and cryptographically verified upon successful completion of your internship.
              </p>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 bg-warm-bg/60 p-4 rounded-xl border border-warm-border">
              <div>
                <span className="font-semibold text-slate-500 uppercase tracking-wide text-[10px] block">Role Title</span>
                <span className="font-bold text-slate-900 text-sm">{activeCredentialModal.internshipTitle}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500 uppercase tracking-wide text-[10px] block">Issuing Organization</span>
                <span className="font-medium text-slate-800">{activeCredentialModal.companyName}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500 uppercase tracking-wide text-[10px] block">Credential ID</span>
                <span className="font-mono font-bold text-primary-800 bg-white px-2 py-1 rounded border border-slate-200 block mt-0.5 select-all">
                  {activeCredentialModal.credentialId}
                </span>
              </div>
              {activeCredentialModal.transactionHash && (
                <div>
                  <span className="font-semibold text-slate-500 uppercase tracking-wide text-[10px] block">Transaction Hash</span>
                  <span className="font-mono text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 block mt-0.5 break-all select-all">
                    {activeCredentialModal.transactionHash}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveCredentialModal(null)}
                className="btn-secondary text-xs py-2 px-3"
              >
                Close
              </button>
              <Link
                to={`/verify-credential/${encodeURIComponent(activeCredentialModal.credentialId)}`}
                target="_blank"
                className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
              >
                <span>Public Verification Page</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
