import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { generateRecommendations, getRecommendations } from '../../api/recommendations.js'
import RiskBadge from '../../components/RiskBadge.jsx'
import CompanyVerificationBadge from '../../components/CompanyVerificationBadge.jsx'
import SkeletonLoader from '../../components/SkeletonLoader.jsx'
import { MotionButton } from '../../components/MotionButton.jsx'

const INPUT =
  'w-full rounded-xl border border-warm-border bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 transition focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20'
const LABEL = 'block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5'

const WORK_MODE_COLORS = {
  REMOTE: 'bg-teal-50 text-teal-700 border-teal-200',
  HYBRID: 'bg-primary-50 text-primary-700 border-primary-200',
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

/**
 * Animated numeric score counter (Category 4)
 * Counts up smoothly from 0.000 to final value over ~600ms
 */
function AnimatedScore({ value, duration = 0.6 }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let start = 0
    const end = typeof value === 'number' ? value : 0
    const startTime = performance.now()
    const durationMs = duration * 1000

    function step(now) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / durationMs, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = start + (end - start) * eased
      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        setDisplayValue(end)
      }
    }

    requestAnimationFrame(step)
  }, [value, duration])

  return <span className="font-mono font-bold text-xs">{displayValue.toFixed(3)}</span>
}

/**
 * Authoritative fit level classification rule:
 * - >= 0.700: Best Match
 * - 0.500–0.699: Strong Match
 * - 0.300–0.499: Good Match
 * - < 0.300: Fair Match
 */
export function getFitLevel(score) {
  if (score == null) return 'Fair Match'
  if (score >= 0.70) return 'Best Match'
  if (score >= 0.50) return 'Strong Match'
  if (score >= 0.30) return 'Good Match'
  return 'Fair Match'
}

/**
 * SignalBadge with Category 4 Animations:
 * - Fill bar grows from 0 to target over ~600ms on viewport entry
 * - Numeric score counts up from 0 to final value over ~600ms
 * - Authoritative fit-level classification
 */
function SignalBadge({ score }) {
  const normalizedWidth = Math.max(5, Math.min(100, Math.round(((score + 0.2) / 1.1) * 100)))
  const signalText = getFitLevel(score)

  let badgeColor = 'bg-slate-50 text-slate-700 border-slate-200'
  let barColor = 'bg-slate-400'

  if (score >= 0.70) {
    badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-300'
    barColor = 'bg-gradient-to-r from-emerald-600 to-teal-500'
  } else if (score >= 0.50) {
    badgeColor = 'bg-success-50 text-success-800 border-success-200'
    barColor = 'bg-gradient-to-r from-success-600 to-primary-600'
  } else if (score >= 0.30) {
    badgeColor = 'bg-primary-50 text-primary-800 border-primary-200'
    barColor = 'bg-gradient-to-r from-primary-600 to-teal-400'
  } else {
    badgeColor = 'bg-accent-50 text-accent-800 border-accent-200'
    barColor = 'bg-gradient-to-r from-accent-500 to-amber-600'
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-2xs ${badgeColor}`}>
        <span className="text-[11px] opacity-75 font-normal">Match:</span>
        <AnimatedScore value={score} duration={0.6} />
        <span className="text-[10px] font-medium opacity-85">({signalText})</span>
      </div>
      <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${normalizedWidth}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className={`h-full rounded-full ${barColor}`}
        />
      </div>
    </div>
  )
}

function RecommendationCard({ rec }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const workModeClass =
    WORK_MODE_COLORS[rec.workMode] ?? 'bg-slate-100 text-slate-600 border-slate-200'
  const fitLevel = rec.fitLevel || getFitLevel(rec.similarityScore)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
      className="card-base card-hover flex flex-col justify-between p-5 space-y-4"
    >
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary-700 text-sm font-heading font-extrabold text-white shadow-sm">
              #{rec.ranking}
            </div>
            <div>
              <Link
                to={`/internships/${rec.internshipId}`}
                className="font-heading text-base font-bold text-slate-900 hover:text-primary-700 transition-colors"
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
          <span className="rounded-full border border-warm-border bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600">
            📍 {rec.country}{rec.city ? `, ${rec.city}` : ''}
          </span>
          {rec.duration && (
            <span className="rounded-full border border-warm-border bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600">
              ⏱ {rec.duration}
            </span>
          )}
          {rec.stipend != null && (
            <span className="rounded-full border border-success-200 bg-success-50 px-2.5 py-0.5 text-xs font-semibold text-success-700">
              💰 {rec.stipend} {rec.currency ?? ''}/mo
            </span>
          )}
          {rec.visaInformation && (
            <span className="rounded-full border border-primary-200 bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
              ✓ Visa Info Provided
            </span>
          )}
        </div>

        {rec.requiredSkills && (
          <div className="mt-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-warm-border">
            <span className="font-semibold text-slate-700">Key Skills: </span>
            <span className="line-clamp-2">{rec.requiredSkills}</span>
          </div>
        )}

        {/* Interactive Explainable AI Recommendations & Skill-Gap Analysis Accordion */}
        <div className="mt-3 overflow-hidden rounded-xl border border-primary-200/70 bg-gradient-to-b from-primary-50/20 via-white to-slate-50/40">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
            className="w-full flex items-center justify-between p-3 text-left transition-colors hover:bg-primary-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                ⚡
              </span>
              <span className="font-heading text-xs font-bold text-slate-800">
                Why this was recommended
              </span>
              {fitLevel && (
                <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-bold text-primary-800 border border-primary-200">
                  {fitLevel}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-primary-700">
              <span className="text-[11px] hidden sm:inline">{isExpanded ? 'Hide' : 'Expand'}</span>
              <motion.span
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="inline-block text-xs"
              >
                ▼
              </motion.span>
            </div>
          </button>

          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                key="explanation-content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden border-t border-primary-100/70 p-3.5 space-y-3.5 bg-white/60"
              >
                {/* Matching Strengths */}
                {rec.matchingStrengths && rec.matchingStrengths.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      MATCHING STRENGTHS
                    </span>
                    <div className="space-y-1 text-slate-700">
                      {rec.matchingStrengths.map((str, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-xs">
                          <span className="font-bold text-emerald-600 flex-shrink-0">✓</span>
                          <span className="text-slate-800 font-medium">{str}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preference Matches */}
                {rec.preferenceMatches && rec.preferenceMatches.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      PREFERENCE MATCHES
                    </span>
                    <div className="space-y-1 text-slate-700">
                      {rec.preferenceMatches.map((pref, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-xs">
                          <span className="font-bold text-teal-600 flex-shrink-0">✓</span>
                          <span className="text-slate-800 font-medium">{pref}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skill Gap Analysis */}
                <div className="space-y-2.5 pt-2 border-t border-slate-200/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    SKILL GAP
                  </span>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-2.5 space-y-1.5">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800">
                        <span>✓</span> Your Skills ({rec.matchedSkills?.length || 0})
                      </div>
                      {rec.matchedSkills && rec.matchedSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {rec.matchedSkills.map((sk, idx) => (
                            <span
                              key={idx}
                              className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200 shadow-2xs"
                            >
                              ✓ {sk}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">No direct skill matches recorded</span>
                      )}
                    </div>

                    <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-2.5 space-y-1.5">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800">
                        <span>⚠</span> Skills to Improve ({rec.missingSkills?.length || 0})
                      </div>
                      {rec.missingSkills && rec.missingSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {rec.missingSkills.map((sk, idx) => (
                            <span
                              key={idx}
                              className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200 shadow-2xs"
                            >
                              ⚠ {sk}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-700 font-medium">All core skills covered!</span>
                      )}
                    </div>
                  </div>

                  {rec.skillGapMessage && (
                    <div className="rounded-lg border border-teal-200/80 bg-teal-50/80 p-2.5 text-xs text-teal-900 flex items-start gap-2">
                      <span className="font-bold flex-shrink-0 text-sm">💡</span>
                      <div className="space-y-0.5">
                        <span className="font-semibold text-teal-950 block text-[11px] uppercase tracking-wide">
                          Skill-gap guidance:
                        </span>
                        <span className="leading-snug">"{rec.skillGapMessage}"</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
          className="text-xs font-semibold text-primary-700 hover:text-primary-800 transition-colors"
        >
          View Details →
        </Link>
      </div>
    </motion.div>
  )
}

export function RecommendationsPage() {
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [hasProfile, setHasProfile] = useState(false)
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

  async function handleClearFilters() {
    setFilters(EMPTY_FILTERS)
    setGenerating(true)
    setError('')
    try {
      const { data } = await generateRecommendations({})
      setHasProfile(data.hasProfile)
      setRecommendations(data.recommendations || [])
      setGeneratedAt(data.generatedAt)
      if (data.message) setMessage(data.message)
    } catch {
      loadRecommendations()
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-warm-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-bold text-primary-800">
              RECOMMENDED FOR YOU
            </span>
            <span className="text-xs text-slate-500">Skill-based match ranking</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Personalized Recommendations
          </h1>
          <p className="mt-1 text-sm text-slate-500 max-w-2xl">
            Opportunities filtered to your preferences and ranked by alignment with your verified skills and resume profile.
          </p>
        </div>

        {hasProfile && (
          <div className="flex items-center gap-2">
            <MotionButton
              type="button"
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
              className="text-xs"
            >
              {showFilters ? 'Hide Filter Panel' : 'Filter Criteria'}
            </MotionButton>
            <MotionButton
              type="button"
              variant="primary"
              pulse={true}
              onClick={handleGenerate}
              disabled={generating}
              className="text-xs flex items-center gap-1.5"
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
            </MotionButton>
          </div>
        )}
      </div>

      {/* Error alert */}
      {error && (
        <div className="rounded-xl bg-danger-50 p-4 text-sm text-danger-700 border border-danger-200">
          {error}
        </div>
      )}

      {/* Optional Filters Drawer/Panel */}
      <AnimatePresence>
        {showFilters && hasProfile && (
          <motion.form
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onSubmit={handleGenerate}
            className="card-base border-primary-200 bg-gradient-to-b from-primary-50/40 to-white p-5 space-y-4 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Refine Matching Criteria
              </h2>
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs font-semibold text-primary-700 hover:text-primary-800 transition cursor-pointer"
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
                    className="h-4 w-4 rounded border-warm-border text-primary-700 focus:ring-primary-600"
                    checked={filters.visaRequired}
                    onChange={handleFilterChange}
                  />
                  Require Visa Info
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <MotionButton
                type="submit"
                variant="primary"
                disabled={generating}
                className="text-xs"
              >
                Apply Filters &amp; Recompute
              </MotionButton>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Loading Skeleton state */}
      {loading && (
        <div className="space-y-4">
          <div className="h-4 w-48 rounded bg-slate-200 animate-pulse" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SkeletonLoader variant="card" count={4} />
          </div>
        </div>
      )}

      {/* State 1: No Profile -> Prompt to upload */}
      {!loading && !hasProfile && (
        <div className="card-base text-center py-12 px-6 space-y-4 max-w-lg mx-auto">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-2xl shadow-xs">
            📄
          </div>
          <h2 className="font-heading text-xl font-bold text-slate-900">
            Resume Profile Needed
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Personalized recommendations require your resume skills. Upload your PDF resume to automatically extract your skills and find matching roles.
          </p>
          <div className="pt-2">
            <Link to="/student/resume" className="btn-primary text-sm px-5 py-2.5">
              Upload Resume PDF →
            </Link>
          </div>
        </div>
      )}

      {/* State 2: Profile exists, but 0 matches */}
      {!loading && hasProfile && recommendations.length === 0 && (
        <div className="card-base text-center py-12 px-6 space-y-4 max-w-lg mx-auto">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-2xl shadow-xs">
            🔍
          </div>
          <h2 className="font-heading text-xl font-bold text-slate-900">
            No Recommendations Generated Yet
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {message ||
              'Click below to discover internships matching your profile preferences and skill set.'}
          </p>
          <div className="mt-6">
            <MotionButton
              type="button"
              variant="primary"
              pulse={true}
              onClick={handleGenerate}
              disabled={generating}
              className="px-5 py-2.5"
            >
              ⚡ Generate Recommendations Now
            </MotionButton>
          </div>
        </div>
      )}

      {/* Recommendations Results List with layout reordering & staggered entrance */}
      {!loading && hasProfile && recommendations.length > 0 && (() => {
        const dedupedRecommendations = recommendations.filter((item, index, self) =>
          index === self.findIndex((t) => (t.internshipId != null && t.internshipId === item.internshipId) ||
            (t.companyName === item.companyName && t.title === item.title))
        )

        return (
          <div className="space-y-4">
            {/* Recommendation Overview Stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="card-base p-4 bg-white border-primary-100/80 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">AI Recommendations</span>
                <div className="mt-1 text-2xl font-bold font-heading text-slate-900">{dedupedRecommendations.length}</div>
                <span className="text-[11px] text-slate-500">Active opportunities</span>
              </div>

              <div className="card-base p-4 bg-white border-emerald-100 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Top Match Score</span>
                <div className="mt-1 text-2xl font-bold font-mono text-emerald-700">
                  {dedupedRecommendations[0]?.similarityScore != null ? dedupedRecommendations[0].similarityScore.toFixed(3) : '—'}
                </div>
                <span className="text-[11px] font-semibold text-emerald-600">
                  {getFitLevel(dedupedRecommendations[0]?.similarityScore)}
                </span>
              </div>

              <div className="card-base p-4 bg-white border-primary-100 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Strong Matches</span>
                <div className="mt-1 text-2xl font-bold font-heading text-primary-700">
                  {dedupedRecommendations.filter((r) => (r.similarityScore ?? 0) >= 0.50).length}
                </div>
                <span className="text-[11px] text-slate-500">Score &ge; 0.500</span>
              </div>

              <div className="card-base p-4 bg-white border-amber-100 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Good Matches</span>
                <div className="mt-1 text-2xl font-bold font-heading text-amber-600">
                  {dedupedRecommendations.filter((r) => (r.similarityScore ?? 0) >= 0.30 && (r.similarityScore ?? 0) < 0.50).length}
                </div>
                <span className="text-[11px] text-slate-500">Score 0.300 – 0.499</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
              <p>
                Showing <span className="font-semibold text-slate-800">{dedupedRecommendations.length}</span> ranked opportunities
                {generatedAt && (
                  <span className="text-xs text-slate-400">
                    {' '}• Computed {new Date(generatedAt).toLocaleDateString()} at {new Date(generatedAt).toLocaleTimeString()}
                  </span>
                )}
              </p>

              <div className="text-xs text-slate-600 bg-slate-100 rounded-lg px-3 py-1 border border-warm-border">
                ℹ️ Match scores represent skill alignment with job requirements. They do not guarantee an interview or offer.
              </div>
            </div>

            <motion.div layout className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <AnimatePresence>
                {dedupedRecommendations.map((rec) => (
                  <RecommendationCard key={rec.id || rec.internshipId} rec={rec} />
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        )
      })()}
    </div>
  )
}

export default RecommendationsPage
