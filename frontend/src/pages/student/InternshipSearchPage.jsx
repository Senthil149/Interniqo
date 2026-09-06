import { useState } from 'react'
import { Link } from 'react-router-dom'
import { searchInternships } from '../../api/internships.js'

const INPUT =
  'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400'
const LABEL = 'block text-xs font-semibold uppercase tracking-wide text-slate-500'

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
  REMOTE: 'bg-sky-100 text-sky-700',
  HYBRID: 'bg-violet-100 text-violet-700',
  ONSITE: 'bg-amber-100 text-amber-700',
}

function InternshipCard({ internship }) {
  const workModeClass =
    WORK_MODE_COLORS[internship.workMode] ?? 'bg-slate-100 text-slate-600'

  return (
    <Link
      to={`/internships/${internship.id}`}
      className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900 group-hover:text-indigo-700">
          {internship.title}
        </h3>
        <span
          className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${workModeClass}`}
        >
          {internship.workMode}
        </span>
      </div>

      <p className="mb-3 text-sm font-medium text-slate-500">{internship.companyName}</p>

      <div className="space-y-1 text-sm text-slate-500">
        <p>
          📍 {internship.country}
          {internship.city ? `, ${internship.city}` : ''}
        </p>
        {internship.duration && <p>⏱ {internship.duration}</p>}
        {internship.stipend != null && (
          <p>
            💰 {internship.stipend} {internship.currency ?? ''}
            <span className="text-slate-400"> / month</span>
          </p>
        )}
        {internship.deadline && (
          <p className="text-xs text-slate-400">⏳ Deadline: {internship.deadline}</p>
        )}
        {internship.visaInformation && (
          <p className="text-xs font-medium text-emerald-600">✓ Visa info provided</p>
        )}
      </div>
    </Link>
  )
}

function InternshipSearchPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [results, setResults] = useState(null)  // null = no search yet
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
    <div className="mx-auto max-w-7xl">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Browse Internships</h1>
        <p className="mt-1 text-sm text-slate-500">
          Use the filters to find opportunities that match your goals. Filters are applied
          server-side — results are never ranked by AI at this stage.
        </p>
      </div>

      <div className="flex gap-6 items-start">
        {/* ── Filter panel ─────────────────────────────────────── */}
        <aside className="w-64 flex-shrink-0">
          <form
            onSubmit={handleSubmit}
            className="sticky top-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="mb-4 text-sm font-bold text-slate-800">Filters</h2>

            <div className="space-y-3">
              <div>
                <label className={LABEL} htmlFor="keyword">Keyword</label>
                <input
                  id="keyword"
                  name="keyword"
                  className={INPUT}
                  placeholder="Title search…"
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
                  placeholder="e.g. India"
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
                  placeholder="e.g. Bangalore"
                  value={filters.city}
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
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  checked={filters.visaRequired}
                  onChange={handleFilterChange}
                />
                <label htmlFor="visaRequired" className="text-xs text-slate-600">
                  Visa info provided
                </label>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <button
                type="submit"
                className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Search
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="w-full rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50"
              >
                Clear
              </button>
            </div>
          </form>
        </aside>

        {/* ── Results panel ─────────────────────────────────────── */}
        <main className="min-w-0 flex-1">
          {/* Status bar */}
          {results !== null && !loading && (
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                {totalElements === 0
                  ? 'No results found.'
                  : `${totalElements} internship${totalElements !== 1 ? 's' : ''} found`}
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
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-44 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          {/* Empty state before any search */}
          {results === null && !loading && (
            <div className="flex h-72 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-center">
              <p className="text-slate-400">Set your filters and click Search.</p>
            </div>
          )}

          {/* No results */}
          {results !== null && results.length === 0 && !loading && (
            <div className="flex h-72 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-center">
              <p className="text-slate-500 font-medium">No internships match your filters.</p>
              <p className="mt-1 text-sm text-slate-400">Try relaxing some constraints.</p>
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
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() => runSearch(page - 1)}
                disabled={page === 0}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
              >
                ← Previous
              </button>
              <span className="flex items-center px-2 text-sm text-slate-500">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => runSearch(page + 1)}
                disabled={page >= totalPages - 1}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
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
