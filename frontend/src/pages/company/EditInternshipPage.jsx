import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCompanyInternship, updateInternship } from '../../api/internships.js'

const INPUT =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
const LABEL = 'block text-sm font-medium text-slate-700'

function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-slate-800">{title}</h2>
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
          deadline: data.deadline ?? '',
          status: data.status ?? 'OPEN',
        })
      })
      .catch(() => setError('Failed to load internship details.'))
      .finally(() => setLoading(false))
  }, [id])

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
      await updateInternship(id, payload)
      navigate('/company/internships')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-40 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    )
  }

  if (!form) {
    return (
      <p className="text-center text-slate-500">
        {error || 'Internship not found.'}
      </p>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Internship</h1>
        <p className="mt-1 text-sm text-slate-500">
          Update the details of your posting. Changes save immediately on submit.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Section title="Basic Information">
          <div>
            <label className={LABEL} htmlFor="title">
              Title <span className="text-red-500">*</span>
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
            <label className={LABEL} htmlFor="description">Description</label>
            <textarea id="description" name="description" rows={4} className={INPUT}
              value={form.description} onChange={handleChange} />
          </div>
          <div>
            <label className={LABEL} htmlFor="requiredSkills">Required Skills</label>
            <textarea id="requiredSkills" name="requiredSkills" rows={2} className={INPUT}
              value={form.requiredSkills} onChange={handleChange} />
          </div>
        </Section>

        <Section title="Location">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL} htmlFor="country">Country <span className="text-red-500">*</span></label>
              <input id="country" name="country" className={INPUT}
                value={form.country} onChange={handleChange} required />
            </div>
            <div>
              <label className={LABEL} htmlFor="city">City</label>
              <input id="city" name="city" className={INPUT}
                value={form.city} onChange={handleChange} />
            </div>
          </div>
          <div>
            <label className={LABEL} htmlFor="workMode">Work Mode <span className="text-red-500">*</span></label>
            <select id="workMode" name="workMode" className={INPUT}
              value={form.workMode} onChange={handleChange} required>
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ONSITE">Onsite</option>
            </select>
          </div>
        </Section>

        <Section title="Schedule & Compensation">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL} htmlFor="duration">Duration</label>
              <input id="duration" name="duration" className={INPUT}
                placeholder="e.g. 3 months" value={form.duration} onChange={handleChange} />
            </div>
            <div>
              <label className={LABEL} htmlFor="deadline">Application Deadline</label>
              <input id="deadline" name="deadline" type="date" className={INPUT}
                value={form.deadline} onChange={handleChange} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL} htmlFor="stipend">Monthly Stipend</label>
              <input id="stipend" name="stipend" type="number" min="0" step="0.01" className={INPUT}
                value={form.stipend} onChange={handleChange} />
            </div>
            <div>
              <label className={LABEL} htmlFor="currency">Currency</label>
              <input id="currency" name="currency" className={INPUT}
                placeholder="e.g. USD" maxLength={8} value={form.currency} onChange={handleChange} />
            </div>
          </div>
        </Section>

        <Section title="Requirements & Cross-Border Info">
          <div>
            <label className={LABEL} htmlFor="eligibility">Eligibility Criteria</label>
            <textarea id="eligibility" name="eligibility" rows={3} className={INPUT}
              value={form.eligibility} onChange={handleChange} />
          </div>
          <div>
            <label className={LABEL} htmlFor="visaInformation">Visa Information</label>
            <textarea id="visaInformation" name="visaInformation" rows={3} className={INPUT}
              value={form.visaInformation} onChange={handleChange} />
          </div>
        </Section>

        <Section title="Status">
          <div>
            <label className={LABEL} htmlFor="status">Posting Status</label>
            <select id="status" name="status" className={INPUT}
              value={form.status} onChange={handleChange}>
              <option value="OPEN">Open — visible to students</option>
              <option value="CLOSED">Closed — hidden from search</option>
            </select>
          </div>
        </Section>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/company/internships')}
            className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default EditInternshipPage
