import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getRiskAssessment } from '../api/risk.js'

const LEVEL_CONFIG = {
  LOW: {
    label: 'Low Risk',
    badgeClass: 'bg-success-50 text-success-700 border-success-200 hover:bg-success-100/80',
    dotClass: 'bg-success-600',
    headerClass: 'text-success-800 bg-success-50/90 border-success-200',
  },
  MEDIUM: {
    label: 'Medium Risk',
    badgeClass: 'bg-accent-50 text-accent-700 border-accent-200 hover:bg-accent-100/80',
    dotClass: 'bg-accent-500',
    headerClass: 'text-accent-800 bg-accent-50/90 border-accent-200',
  },
  HIGH: {
    label: 'High Risk',
    badgeClass: 'bg-danger-50 text-danger-700 border-danger-200 hover:bg-danger-100/80',
    dotClass: 'bg-danger-600 animate-pulse',
    headerClass: 'text-danger-800 bg-danger-50/90 border-danger-200',
  },
}

/**
 * RiskBadge component.
 *
 * Displays an automated risk assessment signal (LOW / MEDIUM / HIGH).
 * Category 5 Animation:
 * - Badge entrance: scale (0.9 -> 1) + fade
 * - Expand/collapse of reasons list: smooth height + opacity transition (~250ms)
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
      <motion.button
        type="button"
        onClick={togglePopover}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={interactive ? { y: -1 } : undefined}
        whileTap={interactive ? { scale: 0.95 } : undefined}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        aria-expanded={open}
        aria-label={`Risk Assessment: ${config.label}, Score ${score} of 100`}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-xs transition-colors cursor-pointer ${config.badgeClass}`}
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
            className={`w-3 h-3 transition-transform duration-200 opacity-60 ${open ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </motion.button>

      {/* Popover / Expand Details with smooth height+opacity animation */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="absolute z-30 mt-2 w-80 sm:w-96 right-0 rounded-2xl border border-warm-border bg-white p-4 shadow-xl text-left focus:outline-none"
          >
            {/* Header */}
            <div className={`-m-4 mb-3 p-3.5 rounded-t-2xl border-b flex items-center justify-between ${config.headerClass}`}>
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${config.dotClass}`} />
                <span className="font-bold text-xs uppercase tracking-wide">
                  Automated Risk Assessment
                </span>
              </div>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white/80 shadow-xs">
                Score: {score} / 100
              </span>
            </div>

            {/* Threshold scale */}
            <div className="space-y-1 mb-3 pt-1">
              <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                <span className="text-success-700">Low (&lt;40)</span>
                <span className="text-accent-700">Medium (40–70)</span>
                <span className="text-danger-700">High (&gt;70)</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-success-500 w-[39%]" />
                <div className="h-full bg-accent-500 w-[31%]" />
                <div className="h-full bg-danger-500 w-[30%]" />
              </div>
            </div>

            {/* Fired indicators list with animated height */}
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-1"
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Fired Risk Indicators:
              </p>

              {loading ? (
                <p className="text-xs text-slate-400 italic py-2">Loading reasons…</p>
              ) : activeReasons.length > 0 ? (
                <ul className="space-y-1.5">
                  {activeReasons.map((reason, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.04 }}
                      className="flex items-start gap-2 text-xs text-slate-700 bg-accent-50/60 p-2.5 rounded-xl border border-accent-100"
                    >
                      <span className="text-accent-500 flex-shrink-0 mt-0.5">⚠️</span>
                      <span className="leading-snug">{reason}</span>
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-600 bg-success-50/70 border border-success-100 p-2.5 rounded-xl leading-relaxed">
                  No automated risk indicators triggered. Note: This indicates absence of detected warning patterns, not proof of legitimacy.
                </p>
              )}
            </motion.div>

            {/* Mandatory Design Rule #3 Disclaimer */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 leading-normal flex items-start gap-1.5">
              <span className="text-slate-400 flex-shrink-0 text-xs mt-0.5">ℹ️</span>
              <span>
                <strong>Warning signal only:</strong> This score is generated by automated pattern analysis. It is not legal proof of fraud and does not guarantee that a listing is safe.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

