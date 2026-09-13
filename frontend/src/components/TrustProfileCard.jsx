import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CompanyVerificationBadge from './CompanyVerificationBadge.jsx'

/**
 * TrustProfileCard Component
 *
 * Exposes a transparent, user-facing trust and risk assessment for an internship opportunity.
 * Built strictly around the existing RiskAssessment engine and Company Verification records.
 *
 * Design & Warning Rules:
 * - Warning mechanism only: never claims "100% Genuine" or "Guaranteed Safe".
 * - Uses calibrated terminology: "Low Risk", "Medium Risk", "High Risk", "Risk indicators", "Verification information".
 * - Explains clearly that email verification confirms inbox control only, not legal business incorporation.
 */
export default function TrustProfileCard({
  riskLevel = 'LOW',
  riskScore = 0,
  riskReasons = [],
  companyEmailVerified = false,
  companyPersonalEmail = false,
  companyWebsiteDomainMatch = false,
  companyWebsite = '',
  companyVerificationStatus = 'UNVERIFIED',
  internship = {},
}) {
  const [showDetails, setShowDetails] = useState(false)

  // Normalize level
  const normalizedLevel = (riskLevel || 'LOW').toUpperCase()
  const isLow = normalizedLevel === 'LOW'
  const isMedium = normalizedLevel === 'MEDIUM'
  const isHigh = normalizedLevel === 'HIGH'

  // Completeness score calculated from presence of key attributes
  const completenessChecks = [
    { label: 'Role Description', passed: Boolean(internship.description && internship.description.length > 30) },
    { label: 'Required Skills Defined', passed: Boolean(internship.requiredSkills) },
    { label: 'Location & Country', passed: Boolean(internship.country) },
    { label: 'Eligibility Requirements', passed: Boolean(internship.eligibility) },
    { label: 'Visa Information', passed: Boolean(internship.visaInformation || internship.visaRequired !== undefined) },
    { label: 'Stipend Terms', passed: Boolean(internship.stipend != null) },
    { label: 'Company Website', passed: Boolean(companyWebsite) },
  ]
  const passedCount = completenessChecks.filter((c) => c.passed).length
  const completenessPercentage = Math.round((passedCount / completenessChecks.length) * 100)

  // Theme styling based on risk level
  const theme = isLow
    ? {
        border: 'border-emerald-200',
        bg: 'bg-emerald-50/40',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        scoreBar: 'from-emerald-500 to-teal-500',
        icon: '🛡️',
        label: 'Low Risk',
        subtitle: 'No prominent suspicious indicators detected during automated scan.',
      }
    : isMedium
    ? {
        border: 'border-amber-200',
        bg: 'bg-amber-50/40',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
        scoreBar: 'from-amber-500 to-orange-500',
        icon: '⚠️',
        label: 'Medium Risk',
        subtitle: 'Review with care: automated heuristic detected potential caution signals.',
      }
    : {
        border: 'border-rose-200',
        bg: 'bg-rose-50/40',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
        scoreBar: 'from-rose-500 to-red-600',
        icon: '🚨',
        label: 'High Risk',
        subtitle: 'Elevated caution advised: posting exhibits patterns common in non-standard listings.',
      }

  return (
    <div className={`card-base border ${theme.border} p-5 sm:p-6 space-y-5 bg-gradient-to-b from-white to-slate-50/50 shadow-sm`}>
      {/* Card Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{theme.icon}</span>
            <h2 className="font-heading text-lg font-bold text-slate-900">
              Internship Trust Profile
            </h2>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${theme.badgeBg}`}>
              {theme.label}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 max-w-xl">
            {theme.subtitle}
          </p>
        </div>

        {/* Risk Score Meter */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-medium text-slate-400">Risk Score:</span>
            <span className="font-mono text-base font-bold text-slate-800">{riskScore}</span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <div className="w-36 h-2 rounded-full bg-slate-200 overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${theme.scoreBar} transition-all duration-500`}
              style={{ width: `${Math.min(100, Math.max(6, riskScore))}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Lower score is safer</span>
        </div>
      </div>

      {/* Primary Trust & Verification Signals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        {/* Signal 1: Company Verification Standing */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Company Status
          </span>
          <div>
            <CompanyVerificationBadge
              verificationStatus={companyVerificationStatus}
              verified={companyEmailVerified}
              personalEmail={companyPersonalEmail}
              websiteDomainMatch={companyWebsiteDomainMatch}
              website={companyWebsite}
              size="sm"
            />
          </div>
          <p className="text-[11px] text-slate-500 leading-normal">
            {companyVerificationStatus === 'COMPANY_VERIFIED'
              ? 'Entity documented & approved.'
              : companyEmailVerified
              ? 'Recruiter verified email address ownership via OTP code.'
              : 'Email verification currently pending.'}
          </p>
        </div>

        {/* Signal 2: Domain Quality */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Domain Authenticity
          </span>
          <div className="flex items-center gap-1.5">
            {companyPersonalEmail ? (
              <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                <span>⚠️</span> Personal Email Provider
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                <span>✓</span> Corporate / Org Domain
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 leading-normal">
            {companyWebsiteDomainMatch
              ? 'Verified email domain directly matches company website.'
              : companyPersonalEmail
              ? 'Registered using public provider (e.g. Gmail). Additional review recommended.'
              : 'Domain registered under institutional domain.'}
          </p>
        </div>

        {/* Signal 3: Information Completeness */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Profile Completeness
          </span>
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-slate-800 text-sm">{completenessPercentage}%</span>
            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-primary-600 rounded-full"
                style={{ width: `${completenessPercentage}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 leading-normal">
            {passedCount} of {completenessChecks.length} transparency fields documented by recruiter.
          </p>
        </div>
      </div>

      {/* Risk Indicators / Reasons Breakdown */}
      {riskReasons && riskReasons.length > 0 ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-rose-800">
            <span>⚠️</span>
            <span>Identified Risk Indicators</span>
          </div>
          <ul className="space-y-1.5 text-rose-900 font-medium">
            {riskReasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-800 font-medium">
            <span className="font-bold text-emerald-600">✓</span>
            <span>Automated scan found no high-risk fee patterns, unrealistic promises, or suspicious payment requests.</span>
          </div>
        </div>
      )}

      {/* Expandable Transparency Checklist Toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowDetails((p) => !p)}
          className="text-xs font-semibold text-primary-700 hover:text-primary-800 flex items-center gap-1 transition cursor-pointer"
        >
          <span>{showDetails ? 'Hide Transparency Checklist' : 'View Posting Transparency Checklist'}</span>
          <span>{showDetails ? '▲' : '▼'}</span>
        </button>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden mt-3 pt-3 border-t border-slate-100"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {completenessChecks.map((check, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100"
                  >
                    <span className="text-slate-700 font-medium">{check.label}</span>
                    <span className={check.passed ? 'text-emerald-700 font-bold' : 'text-slate-400 italic'}>
                      {check.passed ? '✓ Present' : 'Omitted'}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mandatory Regulatory Warning Disclaimer */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-[11px] text-slate-600 leading-relaxed">
        <strong className="font-semibold text-slate-800">Advisory Disclaimer:</strong> This trust profile is an automated heuristic signal based on text patterns and domain records to help students assess opportunities. It is a warning mechanism, not a guarantee of safety or legal proof. Email verification confirms control of the submitted email inbox; it does not by itself certify legal business registration. Students are encouraged to conduct independent research before sharing sensitive information or making commitments.
      </div>
    </div>
  )
}
