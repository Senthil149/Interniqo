import { useEffect, useState } from 'react'
import { getCompanyProfile, updateCompanyProfile } from '../../api/company.js'
import CompanyVerificationBadge from '../../components/CompanyVerificationBadge.jsx'
import SkeletonLoader from '../../components/SkeletonLoader.jsx'

export default function CompanyProfilePage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null) // { type: 'success' | 'error', text: string }

  // Form fields
  const [companyName, setCompanyName] = useState('')
  const [website, setWebsite] = useState('')
  const [country, setCountry] = useState('')
  const [description, setDescription] = useState('')

  async function loadProfile() {
    setLoading(true)
    try {
      const res = await getCompanyProfile()
      const data = res.data
      setProfile(data)
      setCompanyName(data.companyName || '')
      setWebsite(data.website || '')
      setCountry(data.country || '')
      setDescription(data.description || '')
    } catch {
      setMessage({ type: 'error', text: 'Failed to load company profile. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const res = await updateCompanyProfile({
        companyName: companyName.trim(),
        website: website.trim(),
        country: country.trim(),
        description: description.trim(),
      })
      setProfile(res.data)
      setMessage({
        type: 'success',
        text: 'Company profile updated successfully! Domain quality signals have been recalculated.',
      })
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update company profile.',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
        <div className="h-6 w-48 rounded bg-slate-200 animate-pulse" />
        <SkeletonLoader variant="detail-header" count={1} />
        <SkeletonLoader variant="card" count={1} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <div className="border-b border-slate-200/80 pb-5">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Organization Profile &amp; Domain Signals
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your recruiter identity, stated website domain, and live public verification badges.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-2xl p-4 text-xs font-bold border animate-scale-in ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Live Badge Preview Card */}
      {profile && (
        <div className="card-base p-6 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Public Verification Status (Seen by Students &amp; Admins)
          </h2>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-heading text-xl font-bold text-slate-900">{profile.companyName}</p>
              <p className="text-xs text-slate-500 font-mono">{profile.email}</p>
            </div>
            <CompanyVerificationBadge
              verified={profile.emailVerified}
              personalEmail={profile.personalEmail}
              websiteDomainMatch={profile.websiteDomainMatch}
              website={profile.website}
              showWebsiteLink={true}
              size="md"
            />
          </div>

          <div className="border-t border-slate-100 pt-3 text-xs text-slate-500 space-y-1">
            <p>
              Domain Type:{' '}
              {profile.personalEmail ? (
                <span className="font-bold text-amber-700">
                  Personal Email Provider ({profile.emailDomain || 'free provider'}) — Additional Review Recommended
                </span>
              ) : (
                <span className="font-bold text-emerald-700">
                  Organizational Domain ({profile.emailDomain || 'verified domain'})
                </span>
              )}
            </p>
            {profile.website && (
              <p>
                Website Match:{' '}
                {profile.websiteDomainMatch ? (
                  <span className="font-bold text-blue-700">
                    ✓ Email domain matches stated website host
                  </span>
                ) : (
                  <span className="text-slate-500">
                    Email domain does not match stated website host (no penalty)
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Edit Form */}
      <form
        onSubmit={handleSubmit}
        className="card-base p-6 sm:p-8 space-y-5"
      >
        <h2 className="font-heading text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Organization Details
        </h2>

        {/* Company Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Company / Organization Name
          </label>
          <input
            type="text"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="e.g. Acme Corporation"
          />
        </div>

        {/* Registered Email (read-only) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Registered Work Email
          </label>
          <input
            type="email"
            disabled
            value={profile?.email || ''}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-mono text-slate-500 cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-slate-400">
            Work email is tied to your account verification and cannot be changed here.
          </p>
        </div>

        {/* Website */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Company Website <span className="text-xs text-slate-400 font-normal lowercase">(optional)</span>
          </label>
          <input
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="e.g. https://acme-corp.com"
          />
          <p className="mt-1 text-xs text-slate-500">
            When provided, we compare the website host with your email domain. If they match, a &quot;Matches Website&quot; badge will be surfaced.
          </p>
        </div>

        {/* Country */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Country / Region</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="e.g. Germany"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            About the Company
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="Brief overview of your company, mission, and internship culture…"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Saving changes…' : 'Save Profile Changes'}
          </button>
        </div>
      </form>

      {/* Verification Informational Card */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-xs text-amber-900 space-y-2 leading-relaxed">
        <p className="font-bold text-sm text-amber-950 flex items-center gap-1.5">
          <span>ℹ️ Platform Verification Notice</span>
        </p>
        <p>
          Email verification and website domain matching confirm control of the respective inbox and domain name only.
          They do not certify legal incorporation, government business registration, or financial legitimacy.
        </p>
        <p className="text-amber-800">
          <strong>Personal Email Providers:</strong> Small businesses and early-stage companies often use free email providers (e.g. Gmail, Yahoo). Our system highlights this for transparency, but never blocks listings or implies illegitimacy.
        </p>
      </div>
    </div>
  )
}
