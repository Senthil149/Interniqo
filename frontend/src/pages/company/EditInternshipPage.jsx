import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getCompanyInternship, updateInternship } from '../../api/internships.js'
import SkeletonLoader from '../../components/SkeletonLoader.jsx'
import { MotionButton } from '../../components/MotionButton.jsx'

const INPUT =
  'mt-1.5 w-full rounded-xl border border-warm-border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20 shadow-2xs'
const LABEL = 'block text-xs font-bold uppercase tracking-wider text-slate-700'

function Section({ title, children }) {
  return (
    <section className="card-base p-6 space-y-4">
      <h2 className="font-heading text-base font-bold text-slate-900 border-b border-slate-100 pb-2.5">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function EditInternshipPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCompanyInternship(id)
      .then(({ data }) => {
        setForm({
          title: data.title ?? '',
          description: data.description ?? '',
          requiredSkills: data.requiredSkills ?? '',
          country: data.country ?? '',
          city: data.city ?? '',
          workMode: data.workMode ?? 'REMOTE',
          duration: data.duration ?? '',
          stipend: data.stipend != null ? String(data.stipend) : '',
          currency: data.currency ?? '',
          eligibility: data.eligibility ?? '',
          visaInformation: data.visaInformation ?? '',
          visaRequired: Boolean(data.visaRequired),
          relocationRequired: Boolean(data.relocationRequired),
          deadline: data.deadline ?? '',
          status: data.status ?? 'OPEN',
        })
      })
      .catch(() => setError('Failed to load internship details.'))
      .finally(() => setLoading(false))
  }, [id])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        stipend: form.stipend !== '' ? Number(form.stipend) : null,
        deadline: form.deadline || null,
        currency: form.currency || null,
      }
      await updateInternship(id, payload)
      navigate('/company/internships')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update internship. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
        <div className="h-6 w-32 rounded bg-slate-200 animate-pulse" />
        <SkeletonLoader variant="card" count={3} />
      </div>
    )
  }

  if (!form) {
    return (
      <div className="mx-auto max-w-3xl card-base text-center py-12">
        <p className="text-slate-600 font-medium">
          {error || 'Internship opportunity not found.'}
        </p>
        <button
          onClick={() => navigate('/company/internships')}
          className="btn-secondary text-xs mt-4"
        >
          Return to My Listings
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <div className="border-b border-slate-200/80 pb-5">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Edit Internship Opportunity
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Modify the terms, description, or status of this active posting.
        </p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl border border-danger-200 bg-danger-50 p-4 text-xs font-semibold text-danger-700"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.form
        onSubmit={handleSubmit}
        animate={error ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
        className="space-y-6"
      >
        <Section title="Basic Information">
          <div>
            <label className={LABEL} htmlFor="title">
              Role Title <span className="text-danger-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              className={INPUT}
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="description">Description &amp; Deliverables</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              className={INPUT}
              value={form.description}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="requiredSkills">Target Skills &amp; Qualifications</label>
            <textarea
              id="requiredSkills"
              name="requiredSkills"
              rows={2}
              className={INPUT}
              value={form.requiredSkills}
              onChange={handleChange}
            />
          </div>
        </Section>

        <Section title="Arrangement &amp; Location">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL} htmlFor="country">
                Country <span className="text-rose-500">*</span>
              </label>
              <input
                id="country"
                name="country"
                className={INPUT}
                value={form.country}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="city">City</label>
              <input
                id="city"
                name="city"
                className={INPUT}
                value={form.city}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL} htmlFor="workMode">Work Mode</label>
              <select
                id="workMode"
                name="workMode"
                className={INPUT}
                value={form.workMode}
                onChange={handleChange}
              >
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ONSITE">Onsite</option>
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="status">Listing Status</label>
              <select
                id="status"
                name="status"
                className={INPUT}
                value={form.status}
                onChange={handleChange}
              >
                <option value="OPEN">OPEN (Accepting Applications)</option>
                <option value="CLOSED">CLOSED (Archived)</option>
              </select>
            </div>
          </div>
        </Section>

        <Section title="Compensation &amp; Timeline">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL} htmlFor="duration">Duration</label>
              <input
                id="duration"
                name="duration"
                className={INPUT}
                value={form.duration}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="deadline">Application Deadline</label>
              <input
                id="deadline"
                name="deadline"
                type="date"
                className={INPUT}
                value={form.deadline}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL} htmlFor="stipend">Monthly Stipend</label>
              <input
                id="stipend"
                name="stipend"
                type="number"
                min="0"
                step="0.01"
                className={INPUT}
                value={form.stipend}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="currency">Currency</label>
              <input
                id="currency"
                name="currency"
                className={INPUT}
                value={form.currency}
                onChange={handleChange}
              />
            </div>
          </div>
        </Section>

        <Section title="Cross-Border &amp; Eligibility">
          <div>
            <label className={LABEL} htmlFor="eligibility">Eligibility</label>
            <textarea
              id="eligibility"
              name="eligibility"
              rows={3}
              className={INPUT}
              value={form.eligibility}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="visaInformation">Visa Information</label>
            <textarea
              id="visaInformation"
              name="visaInformation"
              rows={3}
              className={INPUT}
              value={form.visaInformation}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/70 transition">
              <input
                type="checkbox"
                name="visaRequired"
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                checked={form.visaRequired}
                onChange={handleChange}
              />
              <div>
                <span className="font-semibold text-xs text-slate-800 block">Visa Required / Supported</span>
                <span className="text-[11px] text-slate-500">Check if international candidates will need work authorization or visa assistance.</span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/70 transition">
              <input
                type="checkbox"
                name="relocationRequired"
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                checked={form.relocationRequired}
                onChange={handleChange}
              />
              <div>
                <span className="font-semibold text-xs text-slate-800 block">Relocation Required</span>
                <span className="text-[11px] text-slate-500">Check if the candidate must physically relocate to the host location.</span>
              </div>
            </label>
          </div>
        </Section>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <MotionButton
            type="submit"
            disabled={submitting}
            className="btn-primary"
            pulse={false}
          >
            {submitting ? 'Updating Listing…' : 'Save Changes'}
          </MotionButton>
          <button
            type="button"
            onClick={() => navigate('/company/internships')}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </motion.form>
    </div>
  )
}

export default EditInternshipPage
