import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { generateRecommendations, getRecommendations } from '../../api/recommendations.js'

const INPUT =
  'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400'
const LABEL = 'block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1'

const WORK_MODE_COLORS = {
  REMOTE: 'bg-sky-100 text-sky-700',
  HYBRID: 'bg-violet-100 text-violet-700',
  ONSITE: 'bg-amber-100 text-amber-700',
}

const EMPTY_FILTERS = {
  country: '',
  city: '',
  workMode: '',
  duration: '',
  minStipend: '',
  currency: '',
  visaRequired: false,
}

function SignalBadge({ score }) {
  // Cosine similarity in normalized SBERT usually ranges between -0.1 to ~0.85
  // Format as pure score (e.g. 0.74) per Design Rule #2 (never percentage / probability)
  const formattedScore = typeof score === 'number' ? score.toFixed(3) : '0.000'
  const normalizedWidth = Math.max(5, Math.min(100, Math.round(((score + 0.2) / 1.1) * 100)))

  let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200'
  let barColor = 'bg-slate-400'
  let signalText = 'Baseline'

  if (score >= 0.55) {
    badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200'
    barColor = 'bg-emerald-500'
    signalText = 'Strong Match'
  } else if (score >= 0.3) {
    badgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-200'
    barColor = 'bg-indigo-500'
    signalText = 'Moderate Match'
  } else if (score > 0.1) {
    badgeColor = 'bg-amber-50 text-amber-700 border-amber-200'
    barColor = 'bg-amber-500'
    signalText = 'Fair Match'
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${badgeColor}`}>
        <span>Signal:</span>
        <span className="font-mono text-sm">{formattedScore}</span>
        <span className="text-[10px] font-normal opacity-80">({signalText})</span>
      </div>
      <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${normalizedWidth}%` }}
        />
      </div>
    </div>
  )
}

function RecommendationCard({ rec }) {
  const workModeClass =
    WORK_MODE_COLORS[rec.workMode] ?? 'bg-slate-100 text-slate-600'

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-sm">
            #{rec.ranking}
          </div>
          <div>
            <Link
              to={`/internships/${rec.internshipId}`}
              className="text-base font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
            >
              {rec.title}
            </Link>
            <p className="text-sm font-medium text-slate-500">{rec.companyName}</p>
          </div>
        </div>

        <SignalBadge score={rec.similarityScore} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${workModeClass}`}>
          {rec.workMode}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
          📍 {rec.country}{rec.city ? `, ${rec.city}` : ''}
        </span>
        {rec.duration && (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
            ⏱ {rec.duration}
          </span>
        )}
        {rec.stipend != null && (
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            💰 {rec.stipend} {rec.currency ?? ''}/mo
          </span>
        )}
        {rec.visaInformation && (
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            ✓ Visa Info Provided
          </span>
        )}
      </div>

      {rec.requiredSkills && (
        <div className="mt-3 text-xs text-slate-600">
          <span className="font-semibold text-slate-700">Required Skills: </span>
          <span className="line-clamp-2">{rec.requiredSkills}</span>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-xs text-slate-400">
          {rec.deadline ? `Deadline: ${rec.deadline}` : 'Open Application'}
        </span>
        <Link
          to={`/internships/${rec.internshipId}`}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          View Details →
        </Link>
      </div>
    </div>
  )
}

function RecommendationsPage() {
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [hasProfile, setHasProfile] = useState(true)
  const [recommendations, setRecommendations] = useState([])
  const [generatedAt, setGeneratedAt] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState(EMPTY_FILTERS)

  useEffect(() => {
    loadRecommendations()
  }, [])

  async function loadRecommendations() {
    setLoading(true)
    setError('')
    try {
      const { data } = await getRecommendations()
      setHasProfile(data.hasProfile)
      setRecommendations(data.recommendations || [])
      setGeneratedAt(data.generatedAt)
      if (data.message) {
        setMessage(data.message)
      }
    } catch (err) {
      setError('Failed to load existing recommendations.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerate(e) {
    if (e) e.preventDefault()
    setGenerating(true)
    setError('')
    try {
      const { data } = await generateRecommendations(filters)
      setHasProfile(data.hasProfile)
      setRecommendations(data.recommendations || [])
      setGeneratedAt(data.generatedAt)
      if (data.message) {
        setMessage(data.message)
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to generate recommendations. Please try again.'
      setError(msg)
    } finally {
      setGenerating(false)
    }
  }

  function handleFilterChange(e) {
    const { name, value, type, checked } = e.target
    setFilters((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  function handleClearFilters() {
    setFilters(EMPTY_FILTERS)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            AI-Powered Recommendations
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Mandatory structured filters are applied first, followed by Sentence-BERT semantic matching
            against your uploaded resume.
          </p>
        </div>

        {hasProfile && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              {showFilters ? 'Hide Filters' : 'Filter Criteria'}
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Generating…</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>{recommendations.length > 0 ? 'Re-Generate' : 'Generate Recommendations'}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Error alert */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {/* Optional Filters Drawer/Panel */}
      {showFilters && hasProfile && (
        <form
          onSubmit={handleGenerate}
          className="rounded-xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Mandatory Hard Filters (Pre-SBERT Execution)
            </h2>
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Reset Filters
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className={LABEL} htmlFor="country">Country</label>
              <input
                id="country"
                name="country"
                className={INPUT}
                placeholder="e.g. Germany, India"
                value={filters.country}
                onChange={handleFilterChange}
              />
            </div>

            <div>
              <label className={LABEL} htmlFor="workMode">Work Mode</label>
              <select
                id="workMode"
                name="workMode"
                className={INPUT}
                value={filters.workMode}
                onChange={handleFilterChange}
              >
                <option value="">Any</option>
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ONSITE">Onsite</option>
              </select>
            </div>

            <div>
              <label className={LABEL} htmlFor="minStipend">Min Stipend</label>
              <input
                id="minStipend"
                name="minStipend"
                type="number"
                min="0"
                className={INPUT}
                placeholder="0"
                value={filters.minStipend}
                onChange={handleFilterChange}
              />
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  name="visaRequired"
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  checked={filters.visaRequired}
                  onChange={handleFilterChange}
                />
                Require Visa Information
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={generating}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              Apply Filters &amp; Generate
            </button>
          </div>
        </form>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-48 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        </div>
      )}

      {/* Graceful No-Resume / No-Profile state */}
      {!loading && !hasProfile && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 px-6 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-2xl text-indigo-600 mb-4">
            📄
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Resume Required for AI Recommendations
          </h2>
          <p className="mt-2 max-w-md text-sm text-slate-600">
            {message ||
              'We need your uploaded resume to extract your skills, experience, and education before generating personalized semantic matches.'}
          </p>
          <div className="mt-6">
            <Link
              to="/student/resume"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              <span>Upload Resume</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      )}

      {/* Empty recommendations state (profile exists but none generated yet) */}
      {!loading && hasProfile && recommendations.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-500 mb-4">
            🎯
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            No Recommendations Generated Yet
          </h2>
          <p className="mt-2 max-w-md text-sm text-slate-600">
            {message ||
              'Click below to filter open internships and run SBERT semantic matching against your profile.'}
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
            >
              <span>✨</span>
              <span>Generate Recommendations Now</span>
            </button>
          </div>
        </div>
      )}

      {/* Recommendations Results List */}
      {!loading && hasProfile && recommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
            <p>
              Showing <span className="font-semibold text-slate-800">{recommendations.length}</span> ranked opportunities
              {generatedAt && (
                <span className="text-xs text-slate-400">
                  {' '}• Generated {new Date(generatedAt).toLocaleDateString()} at {new Date(generatedAt).toLocaleTimeString()}
                </span>
              )}
            </p>

            {/* Design rule #2 educational notice */}
            <div className="text-xs text-slate-500 bg-slate-100/90 rounded-md px-2.5 py-1">
              ℹ️ Match signal is a raw cosine similarity score for ranking (Design Rule #2). Not an admission guarantee.
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {recommendations.map((rec) => (
              <RecommendationCard key={rec.id} rec={rec} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default RecommendationsPage
