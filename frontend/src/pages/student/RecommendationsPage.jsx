import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { generateRecommendations, getRecommendations } from '../../api/recommendations.js'
import RiskBadge from '../../components/RiskBadge.jsx'
import CompanyVerificationBadge from '../../components/CompanyVerificationBadge.jsx'
import SkeletonLoader from '../../components/SkeletonLoader.jsx'

const INPUT =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20'
const LABEL = 'block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5'

const WORK_MODE_COLORS = {
  REMOTE: 'bg-sky-50 text-sky-700 border-sky-200',
  HYBRID: 'bg-blue-50 text-blue-700 border-blue-200',
  ONSITE: 'bg-amber-50 text-amber-700 border-amber-200',
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

  let badgeColor = 'bg-slate-50 text-slate-700 border-slate-200'
  let barColor = 'bg-slate-400'
  let signalText = 'Baseline'

  if (score >= 0.55) {
    badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200'
    barColor = 'bg-gradient-to-r from-emerald-500 to-teal-500'
    signalText = 'Strong Match'
  } else if (score >= 0.3) {
    badgeColor = 'bg-blue-50 text-blue-800 border-blue-200'
    barColor = 'bg-gradient-to-r from-blue-600 to-sky-400'
    signalText = 'Moderate Match'
  } else if (score > 0.1) {
    badgeColor = 'bg-amber-50 text-amber-800 border-amber-200'
    barColor = 'bg-gradient-to-r from-amber-500 to-orange-500'
    signalText = 'Fair Match'
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-2xs ${badgeColor}`}>
        <span className="text-[11px] opacity-75 font-normal">Cosine:</span>
        <span className="font-mono font-bold text-xs">{formattedScore}</span>
        <span className="text-[10px] font-medium opacity-85">({signalText})</span>
      </div>
      <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${normalizedWidth}%` }}
        />
      </div>
    </div>
  )
}

function RecommendationCard({ rec }) {
  const workModeClass =
    WORK_MODE_COLORS[rec.workMode] ?? 'bg-slate-100 text-slate-600 border-slate-200'

  return (
    <div className="card-base card-hover flex flex-col justify-between p-5 space-y-4">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-heading font-extrabold text-white shadow-sm">
              #{rec.ranking}
            </div>
            <div>
              <Link
                to={`/internships/${rec.internshipId}`}
                className="font-heading text-base font-bold text-slate-900 hover:text-blue-600 transition-colors"
              >
                {rec.title}
              </Link>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                <span className="text-sm font-medium text-slate-700">{rec.companyName}</span>
                <CompanyVerificationBadge
                  verified={rec.companyEmailVerified}
                  personalEmail={rec.companyPersonalEmail}
                  websiteDomainMatch={rec.companyWebsiteDomainMatch}
                  website={rec.companyWebsite}
                  size="sm"
                />
              </div>
            </div>
          </div>

          <SignalBadge score={rec.similarityScore} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${workModeClass}`}>
            {rec.workMode}
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600">
            📍 {rec.country}{rec.city ? `, ${rec.city}` : ''}
          </span>
          {rec.duration && (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600">
              ⏱ {rec.duration}
            </span>
          )}
          {rec.stipend != null && (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              💰 {rec.stipend} {rec.currency ?? ''}/mo
            </span>
          )}
          {rec.visaInformation && (
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              ✓ Visa Info Provided
            </span>
          )}
        </div>

        {rec.requiredSkills && (
          <div className="mt-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="font-semibold text-slate-700">Key Skills: </span>
            <span className="line-clamp-2">{rec.requiredSkills}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2">
          <RiskBadge
            level={rec.riskLevel}
            score={rec.riskScore}
            reasons={rec.riskReasons}
            internshipId={rec.internshipId}
          />
          <span className="text-xs text-slate-400">
            {rec.deadline ? `Deadline: ${rec.deadline}` : 'Open Application'}
          </span>
        </div>
        <Link
          to={`/internships/${rec.internshipId}`}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
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
    } catch {
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
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
              AI ENGINE
            </span>
            <span className="text-xs text-slate-500">Sentence-BERT 384d</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Personalized AI Recommendations
          </h1>
          <p className="mt-1 text-sm text-slate-500 max-w-2xl">
            Hard eligibility constraints are strictly filtered first, followed by deep semantic vector matching against your parsed resume skills.
          </p>
        </div>

        {hasProfile && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary text-xs"
            >
              {showFilters ? 'Hide Filter Panel' : 'Filter Criteria'}
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              {generating ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Computing Matches…</span>
                </>
              ) : (
                <>
                  <span>⚡</span>
                  <span>{recommendations.length > 0 ? 'Re-Compute Matches' : 'Generate Matches'}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Error alert */}
      {error && (
        <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700 border border-rose-200">
          {error}
        </div>
      )}

      {/* Optional Filters Drawer/Panel */}
      {showFilters && hasProfile && (
        <form
          onSubmit={handleGenerate}
          className="card-base border-blue-100 bg-gradient-to-b from-blue-50/40 to-white p-5 space-y-4 animate-scale-in"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Mandatory Hard Filters (Pre-SBERT Execution)
            </h2>
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
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
                <option value="">Any Work Mode</option>
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
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  name="visaRequired"
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  checked={filters.visaRequired}
                  onChange={handleFilterChange}
                />
                Require Visa Info
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={generating}
              className="btn-primary text-xs"
            >
              Apply Filters &amp; Recompute
            </button>
          </div>
        </form>
      )}

      {/* Loading Skeleton state */}
      {loading && (
        <div className="space-y-4">
          <div className="h-5 w-48 rounded bg-slate-200 animate-pulse" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SkeletonLoader variant="card" count={4} />
          </div>
        </div>
      )}

      {/* Graceful No-Resume / No-Profile state */}
      {!loading && !hasProfile && (
        <div className="card-base flex flex-col items-center justify-center border-dashed border-blue-300 bg-blue-50/30 px-6 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-2xl text-blue-600 mb-4 shadow-sm">
            📄
          </div>
          <h2 className="font-heading text-lg font-bold text-slate-900">
            Resume Required for AI Recommendations
          </h2>
          <p className="mt-2 max-w-md text-sm text-slate-600 leading-relaxed">
            {message ||
              'Upload your PDF resume once to extract your technical skills, experience, and academic background before generating personalized semantic matches.'}
          </p>
          <div className="mt-6">
            <Link
              to="/student/resume"
              className="btn-primary flex items-center gap-2"
            >
              <span>Upload Resume Now</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      )}

      {/* Empty recommendations state */}
      {!loading && hasProfile && recommendations.length === 0 && (
        <div className="card-base flex flex-col items-center justify-center border-dashed px-6 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-2xl text-amber-600 mb-4 shadow-sm">
            🎯
          </div>
          <h2 className="font-heading text-lg font-bold text-slate-900">
            No Recommendations Generated Yet
          </h2>
          <p className="mt-2 max-w-md text-sm text-slate-600 leading-relaxed">
            {message ||
              'Click below to filter open internships and run SBERT deep semantic embedding matching against your profile.'}
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="btn-primary"
            >
              ⚡ Generate Recommendations Now
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
                  {' '}• Computed {new Date(generatedAt).toLocaleDateString()} at {new Date(generatedAt).toLocaleTimeString()}
                </span>
              )}
            </p>

            {/* Design rule #2 educational notice */}
            <div className="text-xs text-slate-600 bg-slate-100 rounded-lg px-3 py-1 border border-slate-200">
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
