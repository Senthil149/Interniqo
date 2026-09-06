import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getInternship } from '../../api/internships.js'
import RiskBadge from '../../components/RiskBadge.jsx'

const WORK_MODE_COLORS = {
  REMOTE: 'bg-sky-100 text-sky-700',
  HYBRID: 'bg-violet-100 text-violet-700',
  ONSITE: 'bg-amber-100 text-amber-700',
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
  const [internship, setInternship] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getInternship(id)
      .then(({ data }) => setInternship(data))
      .catch(() => setError('Internship not found or could not be loaded.'))
      .finally(() => setLoading(false))
  }, [id])

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
            <p className="mt-1 text-base text-slate-500">{internship.companyName}</p>
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

      {/* Apply placeholder */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5 text-center">
        <p className="text-sm font-medium text-indigo-700">
          Application flow is coming in a future phase.
        </p>
        <Link
          to="/student/internships"
          className="mt-3 inline-block text-sm text-indigo-600 hover:underline"
        >
          ← Browse more internships
        </Link>
      </div>
    </div>
  )
}

export default InternshipDetailPage
