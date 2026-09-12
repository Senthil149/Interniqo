import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createInternship } from '../../api/internships.js'

const INPUT =
  'mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20'
const LABEL = 'block text-xs font-bold uppercase tracking-wider text-slate-700'

const EMPTY_FORM = {
  title: '',
  description: '',
  requiredSkills: '',
  country: '',
  city: '',
  workMode: 'REMOTE',
  duration: '',
  stipend: '',
  currency: '',
  eligibility: '',
  visaInformation: '',
  deadline: '',
}

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

function CreateInternshipPage() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
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
      await createInternship(payload)
      navigate('/company/internships')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create internship. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      {/* Page heading */}
      <div className="border-b border-slate-200/80 pb-5">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Post a New Internship
        </h1>
        <p className="mt-1 text-sm text-slate-500 max-w-xl">
          Publish your opening with comprehensive cross-border, compensation, and skill criteria.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 animate-scale-in">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Section title="Basic Role Information">
          <div>
            <label className={LABEL} htmlFor="title">
              Role Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              className={INPUT}
              placeholder="e.g. Full-Stack Software Engineering Intern"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="description">
              Role Description &amp; Projects
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              className={INPUT}
              placeholder="Describe the projects, expected outcomes, team dynamic, and mentoring support…"
              value={form.description}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="requiredSkills">
              Target Skills (Parsed by SBERT Matcher)
            </label>
            <textarea
              id="requiredSkills"
              name="requiredSkills"
              rows={2}
              className={INPUT}
              placeholder="e.g. Python, PyTorch, React, TypeScript, Docker, REST APIs"
              value={form.requiredSkills}
              onChange={handleChange}
            />
          </div>
        </Section>

        {/* Location */}
        <Section title="Work Arrangement &amp; Location">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL} htmlFor="country">
                Country <span className="text-rose-500">*</span>
              </label>
              <input
                id="country"
                name="country"
                className={INPUT}
                placeholder="e.g. Germany, Singapore, United States"
                value={form.country}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="city">
                City (Optional)
              </label>
              <input
                id="city"
                name="city"
                className={INPUT}
                placeholder="e.g. Munich, Remote"
                value={form.city}
                onChange={handleChange}
              />
            </div>
          </div>
          <div>
            <label className={LABEL} htmlFor="workMode">
              Work Mode <span className="text-rose-500">*</span>
            </label>
            <select
              id="workMode"
              name="workMode"
              className={INPUT}
              value={form.workMode}
              onChange={handleChange}
              required
            >
              <option value="REMOTE">Remote (Cross-Border)</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ONSITE">Onsite</option>
            </select>
          </div>
        </Section>

        {/* Schedule & Compensation */}
        <Section title="Timeline &amp; Compensation">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL} htmlFor="duration">
                Duration
              </label>
              <input
                id="duration"
                name="duration"
                className={INPUT}
                placeholder="e.g. 3-6 months"
                value={form.duration}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="deadline">
                Application Deadline
              </label>
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
              <label className={LABEL} htmlFor="stipend">
                Monthly Stipend
              </label>
              <input
                id="stipend"
                name="stipend"
                type="number"
                min="0"
                step="0.01"
                className={INPUT}
                placeholder="e.g. 1500"
                value={form.stipend}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="currency">
                Currency
              </label>
              <input
                id="currency"
                name="currency"
                className={INPUT}
                placeholder="e.g. USD, EUR, INR"
                maxLength={8}
                value={form.currency}
                onChange={handleChange}
              />
            </div>
          </div>
        </Section>

        {/* Requirements */}
        <Section title="Eligibility &amp; Visa Documentation">
          <div>
            <label className={LABEL} htmlFor="eligibility">
              Candidate Eligibility
            </label>
            <textarea
              id="eligibility"
              name="eligibility"
              rows={3}
              className={INPUT}
              placeholder="e.g. Enrolled in accredited degree program, final-year or recent graduate…"
              value={form.eligibility}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="visaInformation">
              Visa Information &amp; Cross-Border Guidance
            </label>
            <textarea
              id="visaInformation"
              name="visaInformation"
              rows={3}
              className={INPUT}
              placeholder="Document requirements for international applicants or remote work authorization…"
              value={form.visaInformation}
              onChange={handleChange}
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Note: documented visa details establish transparent expectations for students, but do not imply formal government sponsorship guarantees.
            </p>
          </div>
        </Section>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
          >
            {submitting ? 'Publishing Opportunity…' : 'Publish Internship Posting'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/company/internships')}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateInternshipPage
