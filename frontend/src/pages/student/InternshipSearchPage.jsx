import { useState } from 'react'
import { Link } from 'react-router-dom'
import { searchInternships } from '../../api/internships.js'
import RiskBadge from '../../components/RiskBadge.jsx'
import CompanyVerificationBadge from '../../components/CompanyVerificationBadge.jsx'
import SkeletonLoader from '../../components/SkeletonLoader.jsx'

const INPUT =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20'
const LABEL = 'block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1'

const EMPTY_FILTERS = {
  keyword: '',
  country: '',
  city: '',
  workMode: '',
  duration: '',
  minStipend: '',
  currency: '',
  visaRequired: false,
}

const WORK_MODE_COLORS = {
  REMOTE: 'bg-sky-50 text-sky-700 border-sky-200',
  HYBRID: 'bg-blue-50 text-blue-700 border-blue-200',
  ONSITE: 'bg-amber-50 text-amber-700 border-amber-200',
}

function InternshipCard({ internship }) {
  const workModeClass =
    WORK_MODE_COLORS[internship.workMode] ?? 'bg-slate-100 text-slate-600 border-slate-200'

  return (
    <div className="card-base card-hover flex flex-col justify-between p-5 space-y-4">
      <div>
        <div className="mb-2 flex items-start justify-between gap-2">
          <Link
            to={`/internships/${internship.id}`}
            className="font-heading text-base font-bold text-slate-900 hover:text-blue-600 transition-colors leading-snug"
          >
            {internship.title}
          </Link>
          <span className={`flex-shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${workModeClass}`}>
            {internship.workMode}
          </span>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium text-slate-700">{internship.companyName}</span>
          <CompanyVerificationBadge
            verified={internship.companyEmailVerified}
            personalEmail={internship.companyPersonalEmail}
            websiteDomainMatch={internship.companyWebsiteDomainMatch}
            website={internship.companyWebsite}
            size="sm"
          />
        </div>

        <div className="space-y-1.5 text-xs text-slate-500">
          <p className="flex items-center gap-1.5">
            <span>📍</span>
            <span>{internship.country}{internship.city ? `, ${internship.city}` : ''}</span>
          </p>
          {internship.duration && (
            <p className="flex items-center gap-1.5">
              <span>⏱</span>
              <span>{internship.duration}</span>
            </p>
          )}
          {internship.stipend != null && (
            <p className="flex items-center gap-1.5 text-slate-700 font-medium">
              <span>💰</span>
              <span>{internship.stipend} {internship.currency ?? ''} <span className="text-slate-400 font-normal">/ month</span></span>
            </p>
          )}
          {internship.deadline && (
            <p className="text-slate-400">⏳ Deadline: {internship.deadline}</p>
          )}
          {internship.visaInformation && (
            <p className="font-semibold text-blue-600">✓ Visa info provided</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <RiskBadge
          level={internship.riskLevel}
          score={internship.riskScore}
          reasons={internship.riskReasons}
          internshipId={internship.id}
        />
        <Link
          to={`/internships/${internship.id}`}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          Details →
        </Link>
      </div>
    </div>
  )
}

function InternshipSearchPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [results, setResults] = useState(null) // null = no search yet
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleFilterChange(e) {
    const { name, value, type, checked } = e.target
    setFilters((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function runSearch(pageNum = 0) {
    setLoading(true)
    setError('')
    try {
      const { data } = await searchInternships(filters, pageNum, 9)
      setResults(data.content)
      setPage(data.number)
      setTotalPages(data.totalPages)
      setTotalElements(data.totalElements)
    } catch {
      setError('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    runSearch(0)
  }

  function handleClear() {
    setFilters(EMPTY_FILTERS)
    setResults(null)
    setPage(0)
  }

  return (
    <div className="mx-auto max-w-7xl animate-fade-in space-y-6">
      {/* Page header */}
      <div className="border-b border-slate-200/80 pb-5">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Browse Internship Postings
        </h1>
        <p className="mt-1 text-sm text-slate-500 max-w-2xl">
          Search open opportunities across countries, stipends, and work arrangements. All postings undergo automated multi-signal risk evaluations.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ── Filter panel ─────────────────────────────────────── */}
        <aside className="w-full lg:w-72 flex-shrink-0">
          <form
            onSubmit={handleSubmit}
            className="sticky top-20 card-base border-slate-200/90 bg-white p-5 space-y-4 shadow-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-heading text-sm font-bold text-slate-900">Search Filters</h2>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition"
              >
                Reset
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className={LABEL} htmlFor="keyword">Keyword</label>
                <input
                  id="keyword"
                  name="keyword"
                  className={INPUT}
                  placeholder="e.g. Software, Data, Marketing…"
                  value={filters.keyword}
                  onChange={handleFilterChange}
                />
              </div>

              <div>
                <label className={LABEL} htmlFor="country">Country</label>
                <input
                  id="country"
                  name="country"
                  className={INPUT}
                  placeholder="e.g. Germany, Singapore"
                  value={filters.country}
                  onChange={handleFilterChange}
                />
              </div>

              <div>
                <label className={LABEL} htmlFor="city">City</label>
                <input
                  id="city"
                  name="city"
                  className={INPUT}
                  placeholder="e.g. Berlin, Tokyo"
                  value={filters.city}
                  onChange={handleFilterChange}
                />
              </div>

              <div>
                <label className={LABEL} htmlFor="workMode">Work Arrangement</label>
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
                <label className={LABEL} htmlFor="duration">Duration</label>
                <input
                  id="duration"
                  name="duration"
                  className={INPUT}
                  placeholder="e.g. 3 months"
                  value={filters.duration}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
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
                <div>
                  <label className={LABEL} htmlFor="currency">Currency</label>
                  <input
                    id="currency"
                    name="currency"
                    className={INPUT}
                    placeholder="USD"
                    maxLength={8}
                    value={filters.currency}
                    onChange={handleFilterChange}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="visaRequired"
                  name="visaRequired"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  checked={filters.visaRequired}
                  onChange={handleFilterChange}
                />
                <label htmlFor="visaRequired" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Visa info required
                </label>
              </div>
            </div>

            <div className="mt-5 space-y-2 pt-2 border-t border-slate-100">
              <button
                type="submit"
                className="btn-primary w-full text-xs py-2.5"
              >
                Search Listings
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="btn-secondary w-full text-xs py-2"
              >
                Clear All
              </button>
            </div>
          </form>
        </aside>

        {/* ── Results panel ─────────────────────────────────────── */}
        <main className="min-w-0 flex-1 space-y-4">
          {/* Status bar */}
          {results !== null && !loading && (
            <div className="flex items-center justify-between text-sm text-slate-500">
              <p>
                {totalElements === 0
                  ? 'No matching postings found.'
                  : `Found ${totalElements} active internship${totalElements !== 1 ? 's' : ''}`}
              </p>
              {totalPages > 1 && (
                <p className="text-xs text-slate-400">
                  Page {page + 1} of {totalPages}
                </p>
              )}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <SkeletonLoader variant="card" count={6} />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          )}

          {/* Empty state before any search */}
          {results === null && !loading && (
            <div className="card-base flex h-80 flex-col items-center justify-center border-dashed text-center p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-600 mb-3">
                🔍
              </div>
              <h3 className="font-heading font-semibold text-slate-800">Ready to search</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Specify criteria in the filter panel or leave blank to browse all verified listings.
              </p>
              <button
                type="button"
                onClick={() => runSearch(0)}
                className="btn-primary text-xs mt-4"
              >
                Browse All Postings
              </button>
            </div>
          )}

          {/* No results */}
          {results !== null && results.length === 0 && !loading && (
            <div className="card-base flex h-80 flex-col items-center justify-center border-dashed text-center p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-400 mb-3">
                📄
              </div>
              <p className="font-heading font-bold text-slate-800">No internships match your filters.</p>
              <p className="mt-1 text-xs text-slate-400">Try relaxing your keywords, location, or stipend requirements.</p>
              <button
                type="button"
                onClick={handleClear}
                className="btn-secondary text-xs mt-4"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* Result cards */}
          {results !== null && results.length > 0 && !loading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((internship) => (
                <InternshipCard key={internship.id} internship={internship} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {results !== null && totalPages > 1 && !loading && (
            <div className="mt-6 flex justify-center items-center gap-2 pt-4 border-t border-slate-200/80">
              <button
                onClick={() => runSearch(page - 1)}
                disabled={page === 0}
                className="btn-secondary text-xs px-3.5 py-1.5 disabled:opacity-40"
              >
                ← Previous
              </button>
              <span className="px-3 text-xs font-medium text-slate-600">
                {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => runSearch(page + 1)}
                disabled={page >= totalPages - 1}
                className="btn-secondary text-xs px-3.5 py-1.5 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default InternshipSearchPage
