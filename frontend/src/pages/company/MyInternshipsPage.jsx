import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { deleteInternship, getMyInternships } from '../../api/internships.js'
import { analyzeRisk } from '../../api/risk.js'
import RiskBadge from '../../components/RiskBadge.jsx'
import SkeletonLoader from '../../components/SkeletonLoader.jsx'
import Modal from '../../components/Modal.jsx'
import { MotionButton } from '../../components/MotionButton.jsx'

const WORK_MODE_COLORS = {
  REMOTE: 'bg-teal-50 text-teal-700 border-teal-200',
  HYBRID: 'bg-primary-50 text-primary-700 border-primary-200',
  ONSITE: 'bg-amber-50 text-amber-700 border-amber-200',
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
        status === 'OPEN'
          ? 'bg-success-100 text-success-800'
          : 'bg-slate-100 text-slate-600'
      }`}
    >
      {status}
    </span>
  )
}

function InternshipCard({ internship, onRequestDelete, onReanalyze }) {
  const [analyzing, setAnalyzing] = useState(false)
  const workModeClass =
    WORK_MODE_COLORS[internship.workMode] ?? 'bg-slate-100 text-slate-600 border-slate-200'

  async function handleRiskClick() {
    setAnalyzing(true)
    try {
      await onReanalyze(internship.id)
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
      className="card-base card-hover flex flex-col justify-between p-5 space-y-4"
    >
      <div>
        <div className="mb-3 flex items-start justify-between gap-2">
          <h3 className="font-heading text-base font-bold leading-snug text-slate-900">
            {internship.title}
          </h3>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <RiskBadge
              level={internship.riskLevel}
              score={internship.riskScore}
              reasons={internship.riskReasons}
              internshipId={internship.id}
            />
            <StatusBadge status={internship.status} />
          </div>
        </div>

        <div className="space-y-1.5 text-xs text-slate-500">
          <p className="flex items-center gap-1.5">
            <span>📍</span>
            <span>{internship.country}{internship.city ? `, ${internship.city}` : ''}</span>
          </p>
          <p className="flex items-center gap-1.5">
            <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold ${workModeClass}`}>
              {internship.workMode}
            </span>
            {internship.duration && (
              <span className="text-slate-400">· {internship.duration}</span>
            )}
          </p>
          {internship.stipend != null && (
            <p className="flex items-center gap-1.5 font-medium text-slate-700">
              <span>💰</span>
              <span>{internship.stipend} {internship.currency ?? ''} / mo</span>
            </p>
          )}
          {internship.deadline && (
            <p className="text-slate-400">⏳ Deadline: {internship.deadline}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-slate-100 text-xs">
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          whileHover={{ y: -1 }}
          onClick={handleRiskClick}
          disabled={analyzing}
          title="Re-run automated risk assessment"
          className="btn-secondary text-[11px] py-1.5 px-2.5"
        >
          {analyzing ? 'Auditing…' : '🔄 Risk Check'}
        </motion.button>
        <Link
          to={`/company/internships/${internship.id}/edit`}
          className="btn-secondary flex-1 text-center text-xs py-1.5"
        >
          Edit
        </Link>
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          whileHover={{ y: -1 }}
          onClick={() => onRequestDelete(internship)}
          className="rounded-xl border border-danger-200 bg-white px-3 py-1.5 text-xs font-semibold text-danger-600 hover:bg-danger-50 transition cursor-pointer"
        >
          Delete
        </motion.button>
      </div>
    </motion.div>
  )
}

function MyInternshipsPage() {
  const [internships, setInternships] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingItem, setDeletingItem] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    getMyInternships()
      .then(({ data }) => setInternships(data))
      .catch(() => setError('Failed to load your listings.'))
      .finally(() => setLoading(false))
  }, [])

  function requestDelete(internship) {
    setDeletingItem(internship)
  }

  async function handleConfirmDelete() {
    if (!deletingItem) return
    setDeleting(true)
    try {
      await deleteInternship(deletingItem.id)
      setInternships((prev) => prev.filter((i) => i.id !== deletingItem.id))
      setDeletingItem(null)
    } catch {
      setError('Failed to delete. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  async function handleReanalyze(id) {
    try {
      const { data } = await analyzeRisk(id)
      setInternships((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, riskScore: data.score, riskLevel: data.level, riskReasons: data.reasons }
            : i
        )
      )
    } catch {
      setError('Failed to re-analyze risk score. Please try again.')
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-warm-border pb-5">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            My Internship Postings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your company listings, monitor candidate activity, and keep listing details up to date.
          </p>
        </div>
        <MotionButton
          variant="primary"
          pulse={true}
          onClick={() => navigate('/company/internships/new')}
          className="text-xs"
        >
          + Post New Internship
        </MotionButton>
      </div>

      {error && (
        <div className="rounded-2xl border border-danger-200 bg-danger-50 p-4 text-xs font-semibold text-danger-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonLoader variant="card" count={3} />
        </div>
      ) : internships.length === 0 ? (
        <div className="card-base flex flex-col items-center justify-center border-dashed py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-2xl shadow-xs mb-3">
            💼
          </div>
          <p className="font-heading text-lg font-bold text-slate-800">
            No internships posted yet
          </p>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            Create your first opportunity listing to begin receiving automated semantic matches.
          </p>
          <MotionButton
            variant="primary"
            pulse={true}
            onClick={() => navigate('/company/internships/new')}
            className="text-xs mt-4"
          >
            + Create First Listing
          </MotionButton>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {internships.map((internship) => (
              <InternshipCard
                key={internship.id}
                internship={internship}
                onRequestDelete={requestDelete}
                onReanalyze={handleReanalyze}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Category 6: Animated Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingItem}
        onClose={() => !deleting && setDeletingItem(null)}
        title="Confirm Deletion"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-danger-50 border border-danger-200">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-xs font-bold text-danger-800">Permanent Action</p>
              <p className="text-[11px] text-danger-700">
                Are you sure you want to delete <strong className="font-semibold">{deletingItem?.title}</strong>? All applications associated with this posting will be affected.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <MotionButton
              variant="secondary"
              disabled={deleting}
              onClick={() => setDeletingItem(null)}
              className="text-xs"
            >
              Cancel
            </MotionButton>
            <MotionButton
              variant="danger"
              disabled={deleting}
              onClick={handleConfirmDelete}
              className="text-xs"
            >
              {deleting ? 'Deleting…' : 'Delete Posting'}
            </MotionButton>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default MyInternshipsPage