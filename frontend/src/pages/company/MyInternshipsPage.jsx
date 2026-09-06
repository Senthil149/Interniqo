import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { deleteInternship, getMyInternships } from '../../api/internships.js'
import { analyzeRisk } from '../../api/risk.js'
import RiskBadge from '../../components/RiskBadge.jsx'

const WORK_MODE_COLORS = {
  REMOTE: 'bg-sky-100 text-sky-700',
  HYBRID: 'bg-violet-100 text-violet-700',
  ONSITE: 'bg-amber-100 text-amber-700',
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${status === 'OPEN'
        ? 'bg-emerald-100 text-emerald-700'
        : 'bg-slate-100 text-slate-500'
        }`}
    >
      {status}
    </span>
  )
}

function InternshipCard({ internship, onDelete, onReanalyze }) {
  const [analyzing, setAnalyzing] = useState(false)
  const workModeClass =
    WORK_MODE_COLORS[internship.workMode] ?? 'bg-slate-100 text-slate-600'

  async function handleRiskClick() {
    setAnalyzing(true)
    try {
      await onReanalyze(internship.id)
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold leading-snug text-slate-900">
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

      <div className="mb-4 space-y-1.5 text-sm text-slate-500">
        <p>
          📍 {internship.country}
          {internship.city ? `, ${internship.city}` : ''}
        </p>
        <p>
          <span
            className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${workModeClass}`}
          >
            {internship.workMode}
          </span>
          {internship.duration && (
            <span className="ml-2 text-slate-400">· {internship.duration}</span>
          )}
        </p>
        {internship.stipend != null && (
          <p>
            💰 {internship.stipend} {internship.currency ?? ''}
          </p>
        )}
        {internship.deadline && (
          <p>⏳ Deadline: {internship.deadline}</p>
        )}
      </div>

      <div className="mt-auto flex items-center gap-2 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={handleRiskClick}
          disabled={analyzing}
          title="Re-run automated risk assessment"
          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-center text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          {analyzing ? '...' : '🔄 Risk'}
        </button>
        <Link
          to={`/company/internships/${internship.id}/edit`}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Edit
        </Link>
        <button
          onClick={() => onDelete(internship.id)}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
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
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Internship Listings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage the opportunities you have posted.
          </p>
        </div>
        <button
          onClick={() => navigate('/company/internships/new')}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          + Post New Internship
        </button>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-48 animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>
      ) : internships.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-20 text-center">
          <p className="text-lg font-medium text-slate-500">
            No internships posted yet.
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Click &quot;Post New Internship&quot; to get started.
          </p>
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