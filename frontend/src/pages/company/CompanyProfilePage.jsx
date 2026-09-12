import { useEffect, useState } from 'react'
import { getCompanyProfile, updateCompanyProfile } from '../../api/company.js'
import CompanyVerificationBadge from '../../components/CompanyVerificationBadge.jsx'

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
      <div className="mx-auto max-w-3xl py-12 text-center text-slate-500">
        Loading company profile…
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Company Profile & Verification Signals
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your organization details, stated website, and review your public domain-verification badge.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-xl p-4 text-sm font-medium border ${
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
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Public Verification Status (As seen by Students & Admins)
          </h2>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-lg font-bold text-slate-900">{profile.companyName}</p>
              <p className="text-xs text-slate-500">{profile.email}</p>
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

          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="text-xs text-slate-500">
              Domain Type:{' '}
              {profile.personalEmail ? (
                <span className="font-semibold text-amber-700">
                  Personal Email Provider ({profile.emailDomain || 'free provider'}) — Additional Review Recommended
                </span>
              ) : (
                <span className="font-semibold text-emerald-700">
                  Organizational Domain ({profile.emailDomain || 'verified domain'})
                </span>
              )}
            </p>
            {profile.website && (
              <p className="text-xs text-slate-500 mt-1">
                Website Match:{' '}
                {profile.websiteDomainMatch ? (
                  <span className="font-semibold text-sky-700">
                    ✓ Email domain matches stated website
                  </span>
                ) : (
                  <span className="text-slate-500">
                    Email domain does not match stated website (no penalty)
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
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm"
      >
        <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
          Organization Details
        </h2>

        {/* Company Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Company / Organization Name
          </label>
          <input
            type="text"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            placeholder="e.g. Acme Corporation"
          />
        </div>

        {/* Registered Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Registered Work Email
          </label>
          <input
            type="email"
            disabled
            value={profile?.email || ''}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500 cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-slate-400">
            Work email is anchored to your account verification.
          </p>
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Company Website <span className="text-xs text-slate-400 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            placeholder="e.g. https://acme-corp.com"
          />
          <p className="mt-1 text-xs text-slate-500">
            When provided, we compare the website host with your email domain. If they match, a
            &quot;Matches Website&quot; badge will be surfaced.
          </p>
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-slate-700">Country / Region</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            placeholder="e.g. United States"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            About the Company
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            placeholder="Brief overview of your company, mission, and internship culture…"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? 'Saving changes…' : 'Save Profile Changes'}
          </button>
        </div>
      </form>

      {/* Design Rule #4 Informational Card */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-xs text-amber-900 space-y-2 leading-relaxed">
        <p className="font-semibold text-sm text-amber-950 flex items-center gap-1.5">
          <span>ℹ️ Platform Verification Notice (Design Rule #4)</span>
        </p>
        <p>
          Email verification and website domain matching confirm control of the respective inbox and domain name only.
          They do not certify legal incorporation, government business registration, or financial legitimacy.
        </p>
        <p className="text-amber-800">
          <strong>Personal Email Providers:</strong> Small businesses and early-stage companies often use
          free email providers (e.g. Gmail, Yahoo). Our domain-pattern heuristic highlights this for review
          purposes, but never blocks listings or implies illegitimacy.
        </p>
      </div>
    </div>
  )
}
