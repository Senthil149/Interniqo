import { useEffect, useState } from 'react'
import { getStudentPreferences, updateStudentPreferences } from '../api/student.js'
import MotionButton from './MotionButton.jsx'

const LABEL = 'block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1'
const INPUT =
  'w-full rounded-xl border border-warm-border bg-white px-3.5 py-2 text-xs text-slate-800 transition focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20'

export default function PreferencesModal({ isOpen, onClose, onSaved }) {
  const [prefForm, setPrefForm] = useState({
    location: '',
    preferredCountries: '',
    workMode: 'REMOTE',
    relocationPreference: 'WILLING_TO_RELOCATE',
    minimumStipend: '',
    duration: '',
    visaRequired: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!isOpen) return
    let mounted = true
    setLoading(true)
    setErr('')
    setMsg('')
    getStudentPreferences()
      .then(({ data }) => {
        if (mounted && data) {
          setPrefForm({
            location: data.location || '',
            preferredCountries: data.preferredCountries || '',
            workMode: data.workMode || 'REMOTE',
            relocationPreference: data.relocationPreference ? 'WILLING_TO_RELOCATE' : 'REMOTE_ONLY',
            minimumStipend: data.minimumStipend ?? '',
            duration: data.duration || '',
            visaRequired: Boolean(data.visaRequired),
          })
        }
      })
      .catch(() => {
        // defaults remain
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setPrefForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErr('')
    try {
      await updateStudentPreferences({
        preferredCountries: prefForm.preferredCountries,
        location: prefForm.location || null,
        workMode: prefForm.workMode,
        duration: prefForm.duration || null,
        minimumStipend: prefForm.minimumStipend !== '' ? Number(prefForm.minimumStipend) : null,
        relocationPreference: prefForm.relocationPreference === 'WILLING_TO_RELOCATE',
        visaRequired: Boolean(prefForm.visaRequired),
      })
      setMsg('Preferences updated successfully!')
      setTimeout(() => {
        if (onSaved) onSaved()
        onClose()
      }, 600)
    } catch {
      setErr('Failed to save preferences. Please check inputs.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="card-base w-full max-w-lg bg-white p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-warm-border pb-3">
          <div>
            <h3 className="font-heading text-lg font-bold text-slate-900">Your International Preferences</h3>
            <p className="text-xs text-slate-500">Cross-border recommendations evaluate these preferences for match explanation.</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer">
            ✕
          </button>
        </div>

        {msg && <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl">{msg}</div>}
        {err && <div className="p-3 bg-danger-50 border border-danger-200 text-danger-800 text-xs rounded-xl">{err}</div>}

        {loading ? (
          <div className="py-8 text-center text-sm text-slate-500">Loading preferences…</div>
        ) : (
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className={LABEL} htmlFor="pref-countries">
                Preferred Countries (comma-separated)
              </label>
              <input
                id="pref-countries"
                name="preferredCountries"
                className={INPUT}
                placeholder="e.g. Germany, Singapore, United States, India"
                value={prefForm.preferredCountries}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL} htmlFor="pref-mode">
                  Work Mode
                </label>
                <select
                  id="pref-mode"
                  name="workMode"
                  className={INPUT}
                  value={prefForm.workMode}
                  onChange={handleChange}
                >
                  <option value="REMOTE">Remote</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="ONSITE">Onsite</option>
                </select>
              </div>

              <div>
                <label className={LABEL} htmlFor="pref-relo">
                  Relocation Willingness
                </label>
                <select
                  id="pref-relo"
                  name="relocationPreference"
                  className={INPUT}
                  value={prefForm.relocationPreference}
                  onChange={handleChange}
                >
                  <option value="WILLING_TO_RELOCATE">Willing to Relocate</option>
                  <option value="REMOTE_ONLY">Remote Only (No relocation)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL} htmlFor="pref-stipend">
                  Target Min Stipend / mo
                </label>
                <input
                  id="pref-stipend"
                  name="minimumStipend"
                  type="number"
                  min="0"
                  className={INPUT}
                  placeholder="e.g. 500"
                  value={prefForm.minimumStipend}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className={LABEL} htmlFor="pref-duration">
                  Available Duration
                </label>
                <input
                  id="pref-duration"
                  name="duration"
                  className={INPUT}
                  placeholder="e.g. 3 months, 6 months"
                  value={prefForm.duration}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  name="visaRequired"
                  className="h-4 w-4 rounded border-warm-border text-primary-700 focus:ring-primary-600"
                  checked={prefForm.visaRequired}
                  onChange={handleChange}
                />
                Prefer roles with Visa Sponsorship / Guidance
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-warm-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <MotionButton
                type="submit"
                variant="primary"
                disabled={saving}
                className="text-xs"
              >
                {saving ? 'Saving…' : 'Save Preferences'}
              </MotionButton>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
