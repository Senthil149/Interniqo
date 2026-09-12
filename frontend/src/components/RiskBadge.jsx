import { useEffect, useRef, useState } from 'react'
import { getRiskAssessment } from '../api/risk.js'

const LEVEL_CONFIG = {
  LOW: {
    label: 'Low Risk',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80',
    dotClass: 'bg-emerald-500',
    headerClass: 'text-emerald-800 bg-emerald-50/80 border-emerald-200',
  },
  MEDIUM: {
    label: 'Medium Risk',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/80',
    dotClass: 'bg-amber-500',
    headerClass: 'text-amber-800 bg-amber-50/80 border-amber-200',
  },
  HIGH: {
    label: 'High Risk',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/80',
    dotClass: 'bg-rose-500 animate-pulse',
    headerClass: 'text-rose-800 bg-rose-50/80 border-rose-200',
  },
}

/**
 * RiskBadge component.
 *
 * Displays an automated risk assessment signal (LOW / MEDIUM / HIGH).
 *
 * Design Rule #3 compliance:
 * - Clear warning signal: displays raw score (capped at 100).
 * - Non-absolute disclaimer: explicitly states this is an automated heuristic signal,
 *   never proof of fraud or a 'verified safe' guarantee.
 */
export default function RiskBadge({
  level = 'LOW',
  score = 0,
  reasons = [],
  internshipId = null,
  showScore = true,
  interactive = true,
}) {
  const [open, setOpen] = useState(false)
  const [fetchedReasons, setFetchedReasons] = useState(null)
  const [loading, setLoading] = useState(false)
  const popoverRef = useRef(null)

  const effectiveLevel = (level || 'LOW').toUpperCase()
  const config = LEVEL_CONFIG[effectiveLevel] || LEVEL_CONFIG.LOW

  // Normalize reasons list
  const activeReasons = fetchedReasons || (Array.isArray(reasons) ? reasons : (reasons ? [reasons] : []))

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  async function togglePopover(e) {
    if (!interactive) return
    e.preventDefault()
    e.stopPropagation()

    const willOpen = !open
    setOpen(willOpen)

    // Fetch full reasons if not provided and internshipId exists
    if (willOpen && internshipId && (!reasons || reasons.length === 0) && !fetchedReasons) {
      setLoading(true)
      try {
        const { data } = await getRiskAssessment(internshipId)
        if (data && data.reasons) {
          setFetchedReasons(data.reasons)
        }
      } catch {
        // Fallback silently if fetch fails
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      <button
        type="button"
        onClick={togglePopover}
        aria-expanded={open}
        aria-label={`Risk Assessment: ${config.label}, Score ${score} of 100`}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-xs transition-all duration-150 cursor-pointer ${config.badgeClass}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} />
        <span>{config.label}</span>
        {showScore && (
          <span className="font-mono text-[11px] opacity-85">
            {score}/100
          </span>
        )}
        {interactive && (
          <svg
            className={`w-3 h-3 transition-transform duration-150 opacity-60 ${open ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Popover / Expand Details */}
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute z-30 mt-2 w-80 sm:w-96 right-0 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xl text-left focus:outline-none animate-scale-in"
        >
          {/* Header */}
          <div className={`-m-4 mb-3 p-3.5 rounded-t-2xl border-b flex items-center justify-between ${config.headerClass}`}>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${config.dotClass}`} />
              <span className="font-bold text-xs uppercase tracking-wide">
                Automated Risk Assessment
              </span>
            </div>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white/70 shadow-xs">
              Score: {score} / 100
            </span>
          </div>

          {/* Threshold scale */}
          <div className="space-y-1 mb-3 pt-1">
            <div className="flex justify-between text-[10px] font-semibold text-slate-500">
              <span className="text-emerald-700">Low (&lt;40)</span>
              <span className="text-amber-700">Medium (40–70)</span>
              <span className="text-rose-700">High (&gt;70)</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div className="h-full bg-emerald-400 w-[39%]" />
              <div className="h-full bg-amber-400 w-[31%]" />
              <div className="h-full bg-rose-400 w-[30%]" />
            </div>
          </div>

          {/* Fired indicators */}
          <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              Fired Risk Indicators:
            </p>

            {loading ? (
              <p className="text-xs text-slate-400 italic py-2">Loading reasons…</p>
            ) : activeReasons.length > 0 ? (
              <ul className="space-y-1.5">
                {activeReasons.map((reason, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs text-slate-700 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100"
                  >
                    <span className="text-amber-500 flex-shrink-0 mt-0.5">⚠️</span>
                    <span className="leading-snug">{reason}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-600 bg-emerald-50/70 border border-emerald-100 p-2.5 rounded-xl leading-relaxed">
                No automated risk indicators triggered. Note: This indicates absence of detected warning patterns, not proof of legitimacy.
              </p>
            )}
          </div>

          {/* Mandatory Design Rule #3 Disclaimer */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 leading-normal flex items-start gap-1.5">
            <span className="text-slate-400 flex-shrink-0 text-xs mt-0.5">ℹ️</span>
            <span>
              <strong>Warning signal only:</strong> This score is generated by automated pattern analysis. It is not legal proof of fraud and does not guarantee that a listing is safe.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
