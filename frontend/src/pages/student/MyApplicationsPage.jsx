import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getApplications } from '../../api/applications.js'
import { getMyCredentials } from '../../api/credentials.js'
import SkeletonLoader from '../../components/SkeletonLoader.jsx'
import { MotionButton } from '../../components/MotionButton.jsx'
import Modal from '../../components/Modal.jsx'
import CredentialQRCode from '../../components/CredentialQRCode.jsx'

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
  const [activeQrModal, setActiveQrModal] = useState(null)

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

                    {/* Blockchain Credential Link if Issued */}
                    {credentialsMap[app.internshipId] && (
                      <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setActiveCredentialModal({
                            ...credentialsMap[app.internshipId],
                            internshipTitle: app.internshipTitle,
                            companyName: app.companyName,
                          })}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100/90 border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/80 hover:text-slate-900 transition cursor-pointer shadow-2xs"
                          data-testid={`view-credential-btn-${app.id}`}
                        >
                          <svg className="w-4 h-4 text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>View Credential</span>
                        </button>

                        <MotionButton
                          type="button"
                          onClick={() => setActiveQrModal({
                            ...credentialsMap[app.internshipId],
                            internshipTitle: app.internshipTitle,
                            companyName: app.companyName,
                          })}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-success-50 border border-success-300 px-3.5 py-2 text-xs font-bold text-success-800 hover:bg-success-100 transition cursor-pointer shadow-2xs"
                          data-testid={`view-qr-btn-${app.id}`}
                        >
                          <svg className="w-4 h-4 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                          <span>Generate / View QR</span>
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

      {/* Credential Result Dialog Modal */}
      <Modal
        isOpen={Boolean(activeCredentialModal)}
        onClose={() => setActiveCredentialModal(null)}
        title="Verified Internship Credential"
      >
        {activeCredentialModal && (
          <div className="space-y-4" data-testid="student-credential-modal">
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

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const cred = activeCredentialModal
                  setActiveCredentialModal(null)
                  setActiveQrModal(cred)
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-success-800 bg-success-50 border border-success-300 rounded-xl px-3 py-2 hover:bg-success-100 transition cursor-pointer"
                data-testid="switch-to-qr-btn"
              >
                <svg className="w-3.5 h-3.5 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <span>View QR Code</span>
              </button>

              <div className="flex items-center gap-2">
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
          </div>
        )}
      </Modal>

      {/* Dedicated Blockchain Credential QR Code Modal */}
      <Modal
        isOpen={Boolean(activeQrModal)}
        onClose={() => setActiveQrModal(null)}
        title="Blockchain Credential QR Code"
      >
        {activeQrModal && (
          <div className="space-y-4" data-testid="student-qr-modal">
            <div className="rounded-xl border border-primary-200 bg-primary-50/70 p-3 text-xs text-primary-900">
              <p className="font-bold text-sm text-primary-900">
                {activeQrModal.internshipTitle}
              </p>
              <p className="text-primary-700 text-xs mt-0.5">
                Issued by {activeQrModal.companyName} • ID: <span className="font-mono font-bold">{activeQrModal.credentialId}</span>
              </p>
            </div>

            <CredentialQRCode
              credentialId={activeQrModal.credentialId}
              size={200}
              showDetails={true}
              showCopy={true}
              showDownload={true}
            />

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveQrModal(null)}
                className="btn-secondary text-xs py-2 px-3.5"
                data-testid="close-qr-modal-btn"
              >
                Close
              </button>
              <Link
                to={`/verify-credential/${encodeURIComponent(activeQrModal.credentialId)}`}
                target="_blank"
                className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
                data-testid="open-verify-from-modal-btn"
              >
                <span>Open Verification Page</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

