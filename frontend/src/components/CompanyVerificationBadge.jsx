import { useState, useRef, useEffect } from 'react'

/**
 * CompanyVerificationBadge Component
 *
 * Displays:
 * 1. Verified email status + domain type (Organizational vs. Personal Email Provider).
 * 2. Optional "Matches Stated Website" indicator when email domain matches website.
 * 3. Interactive Design Rule #4 disclaimer popover clarifying what is and is not proven.
 *
 * Design Rule #4 Compliance:
 * - Informational domain heuristic only: never frames personal email as proof of illegitimacy.
 * - Explains clearly that email and domain verification confirm inbox/domain control only,
 *   not legal incorporation, business legitimacy, or official identity.
 */
export default function CompanyVerificationBadge({
  verificationStatus = 'UNVERIFIED',
  verified = false,
  companyVerified = false,
  personalEmail = false,
  websiteDomainMatch = false,
  website = '',
  emailDomain = '',
  showWebsiteLink = false,
  size = 'sm',
  interactive = true,
}) {
  const [popoverOpen, setPopoverOpen] = useState(false)
  const popoverRef = useRef(null)

  // Derive effective status
  const isCompanyFullyVerified =
    verificationStatus === 'COMPANY_VERIFIED' || companyVerified === true
  const isEmailVerified =
    isCompanyFullyVerified ||
    verificationStatus === 'EMAIL_VERIFIED' ||
    verified === true

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setPopoverOpen(false)
      }
    }
    if (popoverOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [popoverOpen])

  const isSmall = size === 'sm'
  const pillPadding = isSmall ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'

  return (
    <div className="relative inline-flex flex-wrap items-center gap-1.5" ref={popoverRef}>
      {/* Primary Verification Badge */}
      {isCompanyFullyVerified ? (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border font-semibold bg-indigo-50 text-indigo-800 border-indigo-200 shadow-xs ${pillPadding}`}
          title="Full corporate verification completed (legal business registration and organizational control confirmed)."
        >
          <span className="text-indigo-600 font-bold">🛡</span>
          <span>✓ Company Verified</span>
        </span>
      ) : isEmailVerified ? (
        personalEmail ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border font-medium bg-amber-50 text-amber-800 border-amber-200 shadow-xs ${pillPadding}`}
            title="Email ownership verified with personal email provider. Additional review recommended."
          >
            <span className="text-amber-500 font-bold">✓</span>
            <span>Verified Email</span>
          </span>
        ) : (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border font-semibold bg-emerald-50 text-emerald-800 border-emerald-200 shadow-xs ${pillPadding}`}
            title="Email ownership verified via 6-digit OTP (inbox control confirmed)."
          >
            <span className="text-emerald-600 font-bold">✓</span>
            <span>Email Verified Company</span>
          </span>
        )
      ) : (
        <span
          className={`inline-flex items-center gap-1 rounded-full border font-medium bg-slate-100 text-slate-600 border-slate-200 ${pillPadding}`}
          title="Email has not yet completed verification."
        >
          <span>Unverified Email</span>
        </span>
      )}

      {/* Website Domain Match Indicator (Shown only when matching, no penalty if not) */}
      {websiteDomainMatch && (
        <span
          className={`inline-flex items-center gap-1 rounded-full border font-medium bg-blue-50 text-blue-800 border-blue-200 shadow-xs ${pillPadding}`}
          title="Stated company website matches the verified email domain."
        >
          <span>🌐</span>
          <span>Matches Website</span>
        </span>
      )}

      {/* Optional Website Link */}
      {showWebsiteLink && website && (
        <a
          href={website.startsWith('http') ? website : `https://${website}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-0.5 ml-0.5 font-medium"
          title={`Visit company website: ${website}`}
        >
          <span>Visit website ↗</span>
        </a>
      )}

      {/* Interactive Info Icon Button (Design Rule #4) */}
      {interactive && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setPopoverOpen((prev) => !prev)
          }}
          className="inline-flex items-center justify-center h-4 w-4 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          aria-label="Explain verification status details"
          title="View verification details"
        >
          ℹ
        </button>
      )}

      {/* Popover explaining signals honestly per Design Rule #4 */}
      {popoverOpen && (
        <div
          className="absolute left-0 top-full z-50 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700 shadow-xl animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between border-b border-slate-100 pb-2.5 mb-2.5">
            <h4 className="font-heading font-semibold text-slate-900 text-sm flex items-center gap-1.5">
              <span>Domain Verification Signals</span>
            </h4>
            <button
              type="button"
              onClick={() => setPopoverOpen(false)}
              className="text-slate-400 hover:text-slate-700 font-bold px-1 rounded hover:bg-slate-100"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2.5">
            {/* Inbox control signal */}
            <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
              <p className="font-semibold text-slate-800">
                Email Status: {verified ? '✓ Verified (Inbox Control Confirmed)' : 'Pending Verification'}
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {verified
                  ? 'The company has proven ownership and control of this specific email address via secure code verification.'
                  : 'This email has not completed the mandatory verification code process.'}
              </p>
            </div>

            {/* Personal vs Org Domain heuristic */}
            <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
              <p className="font-semibold text-slate-800">
                Domain Type:{' '}
                {personalEmail ? (
                  <span className="text-amber-700 font-medium">
                    Personal Email Provider {emailDomain ? `(${emailDomain})` : '(e.g., Gmail, Yahoo)'}
                  </span>
                ) : (
                  <span className="text-emerald-700 font-medium">
                    Genuine Organizational Domain {emailDomain ? `(${emailDomain})` : ''}
                  </span>
                )}
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {personalEmail ? (
                  <>
                    <strong className="text-amber-800">Additional Review Recommended:</strong> This
                    is an informational indicator. Many genuine small businesses and
                    startups legitimately use personal email providers; this is <em>not</em> proof
                    the company is illegitimate.
                  </>
                ) : (
                  'The email is registered under a custom corporate or educational domain.'
                )}
              </p>
            </div>

            {/* Website matching */}
            {websiteDomainMatch ? (
              <div className="rounded-xl bg-blue-50/70 p-2.5 border border-blue-100">
                <p className="font-semibold text-blue-900">🌐 Website Domain Match Confirmed</p>
                <p className="text-[11px] text-blue-800 mt-0.5">
                  The verified email domain matches the stated website domain. This provides an
                  additional signal that the recruiter controls the same domain as their public web
                  presence.
                </p>
              </div>
            ) : website ? (
              <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                <p className="font-medium text-slate-700">Stated Website: {website}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  The website domain does not match the email domain. No penalty is applied.
                </p>
              </div>
            ) : null}

            <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-2.5 text-[11px] text-amber-900 leading-relaxed">
              <strong className="font-semibold">Notice:</strong> Verification
              confirms inbox and domain control only. It does not certify legal company
              incorporation, government registration, or business legitimacy.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
