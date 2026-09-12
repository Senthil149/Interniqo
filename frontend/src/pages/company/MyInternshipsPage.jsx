import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { deleteInternship, getMyInternships } from '../../api/internships.js'
import { analyzeRisk } from '../../api/risk.js'
import RiskBadge from '../../components/RiskBadge.jsx'
import SkeletonLoader from '../../components/SkeletonLoader.jsx'

const WORK_MODE_COLORS = {
  REMOTE: 'bg-sky-50 text-sky-700 border-sky-200',
  HYBRID: 'bg-blue-50 text-blue-700 border-blue-200',
  ONSITE: 'bg-amber-50 text-amber-700 border-amber-200',
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
        status === 'OPEN'
          ? 'bg-emerald-100 text-emerald-800'
          : 'bg-slate-100 text-slate-600'
      }`}
    >
      {status}
    </span>
  )
}

function InternshipCard({ internship, onDelete, onReanalyze }) {
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
    <div className="card-base card-hover flex flex-col justify-between p-5 space-y-4">
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
        <button
          type="button"
          onClick={handleRiskClick}
          disabled={analyzing}
          title="Re-run automated risk assessment"
          className="btn-secondary text-[11px] py-1.5 px-2.5"
        >
          {analyzing ? 'Auditing…' : '🔄 Risk Check'}
        </button>
        <Link
          to={`/company/internships/${internship.id}/edit`}
          className="btn-secondary flex-1 text-center text-xs py-1.5"
        >
          Edit
        </Link>
        <button
          onClick={() => onDelete(internship.id)}
          className="rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

function MyInternshipsPage() {
  const [internships, setInternships] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    getMyInternships()
      .then(({ data }) => setInternships(data))
      .catch(() => setError('Failed to load your listings.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id) {
    if (!window.confirm('Delete this internship? This cannot be undone.')) return
    try {
      await deleteInternship(id)
      setInternships((prev) => prev.filter((i) => i.id !== id))
    } catch {
      setError('Failed to delete. Please try again.')
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
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            My Internship Postings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your company listings, monitor candidate activity, and trigger heuristic risk re-assessments.
          </p>
        </div>
        <button
          onClick={() => navigate('/company/internships/new')}
          className="btn-primary text-xs"
        >
          + Post New Internship
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 animate-scale-in">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonLoader variant="card" count={3} />
        </div>
      ) : internships.length === 0 ? (
        <div className="card-base flex flex-col items-center justify-center border-dashed py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-600 mb-3 shadow-xs">
            💼
          </div>
          <p className="font-heading text-lg font-bold text-slate-800">
            No internships posted yet
          </p>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            Create your first opportunity listing to begin receiving automated semantic matches.
          </p>
          <button
            onClick={() => navigate('/company/internships/new')}
            className="btn-primary text-xs mt-4"
          >
            + Create First Listing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {internships.map((internship) => (
            <InternshipCard
              key={internship.id}
              internship={internship}
              onDelete={handleDelete}
              onReanalyze={handleReanalyze}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default MyInternshipsPage