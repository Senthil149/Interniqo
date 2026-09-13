import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getStudentProfile,
  updateStudentProfile,
  uploadProfilePhoto,
  removeProfilePhoto,
  uploadResume,
  getStudentResumeBlob,
  getStudentPreferences,
  resolvePhotoUrl,
} from '../../api/student.js'
import SkeletonLoader from '../../components/SkeletonLoader.jsx'
import MotionButton from '../../components/MotionButton.jsx'
import PreferencesModal from '../../components/PreferencesModal.jsx'

const MAX_RESUME_BYTES = 5 * 1024 * 1024 // 5 MB
const MAX_PHOTO_BYTES = 2 * 1024 * 1024 // 2 MB

export default function StudentProfilePage() {
  const [profile, setProfile] = useState(null)
  const [preferences, setPreferences] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null) // { type: 'success' | 'error', text: string }
  const [photoError, setPhotoError] = useState(false)

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPrefModalOpen, setIsPrefModalOpen] = useState(false)

  // Quick skill input state
  const [newSkillInput, setNewSkillInput] = useState('')
  const [savingSkill, setSavingSkill] = useState(false)

  // Resume state
  const [uploadingResume, setUploadingResume] = useState(false)
  const [viewingResume, setViewingResume] = useState(false)
  const resumeInputRef = useRef(null)

  function showToast(text, type = 'success') {
    setToast({ text, type })
    setTimeout(() => setToast(null), 4000)
  }

  async function loadData() {
    setLoading(true)
    try {
      const [profRes, prefRes] = await Promise.allSettled([
        getStudentProfile(),
        getStudentPreferences(),
      ])

      if (profRes.status === 'fulfilled') {
        setProfile(profRes.value.data)
        setPhotoError(false)
      }
      if (prefRes.status === 'fulfilled') {
        setPreferences(prefRes.value.data)
      }
    } catch {
      showToast('Failed to load profile details.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // ── Quick Skill Chip Management ──────────────────────────────────────────

  async function handleAddSkill(e) {
    if (e) e.preventDefault()
    const trimmed = newSkillInput.trim()
    if (!trimmed || !profile) return

    const currentSkills = profile.skillList || []
    // Duplicate check (case-insensitive)
    if (currentSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      showToast(`"${trimmed}" is already in your skills list.`, 'error')
      setNewSkillInput('')
      return
    }

    const updatedSkills = [...currentSkills, trimmed]
    setSavingSkill(true)
    try {
      const res = await updateStudentProfile({ skills: updatedSkills })
      setProfile(res.data)
      setNewSkillInput('')
      showToast(`Added skill: ${trimmed}`)
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add skill.', 'error')
    } finally {
      setSavingSkill(false)
    }
  }

  async function handleRemoveSkill(skillToRemove) {
    if (!profile) return
    const currentSkills = profile.skillList || []
    const updatedSkills = currentSkills.filter((s) => s !== skillToRemove)

    try {
      const res = await updateStudentProfile({ skills: updatedSkills })
      setProfile(res.data)
      showToast(`Removed skill: ${skillToRemove}`)
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove skill.', 'error')
    }
  }

  // ── Resume Handling ───────────────────────────────────────────────────────

  function handleResumeFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showToast('Only PDF resume files are accepted.', 'error')
      if (resumeInputRef.current) resumeInputRef.current.value = ''
      return
    }
    if (file.size > MAX_RESUME_BYTES) {
      showToast(`Resume exceeds 5 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`, 'error')
      if (resumeInputRef.current) resumeInputRef.current.value = ''
      return
    }

    uploadResumeFile(file)
  }

  async function uploadResumeFile(file) {
    setUploadingResume(true)
    try {
      await uploadResume(file)
      // Refresh profile data to get updated filename and skills
      const updated = await getStudentProfile()
      setProfile(updated.data)
      showToast('Resume uploaded and extracted successfully!')
    } catch (err) {
      showToast(err.response?.data?.message || 'Resume upload failed.', 'error')
    } finally {
      setUploadingResume(false)
      if (resumeInputRef.current) resumeInputRef.current.value = ''
    }
  }

  async function handleViewResume() {
    if (viewingResume) return
    setViewingResume(true)

    // Open a blank tab synchronously during user click to prevent popup blockers
    const newWindow = window.open('about:blank', '_blank')
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head><title>Loading Resume Preview...</title></head>
          <body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:system-ui,-apple-system,sans-serif;background:#0f172a;color:#f8fafc;">
            <div style="text-align:center;">
              <div style="font-size:32px;margin-bottom:12px;">📄</div>
              <p style="font-size:16px;font-weight:600;margin:0;">Loading Resume Preview...</p>
              <p style="font-size:12px;color:#94a3b8;margin-top:6px;">Retrieving secure PDF document...</p>
            </div>
          </body>
        </html>
      `)
    }

    try {
      const response = await getStudentResumeBlob()
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const objectUrl = URL.createObjectURL(blob)

      if (newWindow && !newWindow.closed) {
        newWindow.location.href = objectUrl
      } else {
        window.open(objectUrl, '_blank')
      }

      // Allow 60 seconds for the browser's PDF viewer to load before releasing memory
      setTimeout(() => {
        try {
          URL.revokeObjectURL(objectUrl)
        } catch (e) {
          // ignore
        }
      }, 60000)
    } catch (err) {
      if (newWindow && !newWindow.closed) {
        newWindow.close()
      }
      showToast(
        err.response?.data?.message || 'Failed to open resume. Please ensure a resume is uploaded.',
        'error'
      )
    } finally {
      setViewingResume(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <SkeletonLoader variant="detail-header" count={1} />
        <SkeletonLoader variant="card" count={2} />
      </div>
    )
  }

  const skillsList = profile?.skillList || []

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in pb-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={`fixed top-20 right-6 z-50 rounded-2xl px-5 py-3 text-xs font-bold shadow-lg border backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-500/10'
                : 'bg-rose-50 text-rose-800 border-rose-200 shadow-rose-500/10'
            }`}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 1. Header Card ───────────────────────────────────────────────── */}
      <div className="card-base p-6 sm:p-8 relative overflow-hidden bg-gradient-to-br from-white via-primary-50/20 to-slate-50 border-warm-border">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar / Photo */}
          <div className="relative group">
            {profile?.profilePhotoUrl && !photoError ? (
              <img
                src={resolvePhotoUrl(profile.profilePhotoUrl)}
                alt={profile.name || 'Student'}
                onError={() => setPhotoError(true)}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-white shadow-md ring-2 ring-primary-100"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white text-3xl font-extrabold shadow-md border-2 border-white ring-2 ring-primary-100">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : 'S'}
              </div>
            )}
          </div>

          {/* Student Info */}
          <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  {profile?.name || 'Student Profile'}
                </h1>
                <p className="text-sm font-semibold text-primary-700 mt-0.5">
                  {profile?.professionalHeadline || (
                    <span className="text-slate-400 italic font-normal">
                      No headline added yet (e.g. Full Stack Developer | ML Enthusiast)
                    </span>
                  )}
                </p>
              </div>

              {/* Edit Profile Button */}
              <MotionButton
                onClick={() => setIsEditModalOpen(true)}
                variant="primary"
                className="text-xs px-4 py-2 self-center sm:self-start shadow-xs flex-shrink-0"
              >
                ✏️ Edit Profile
              </MotionButton>
            </div>

            {/* Location and College Meta */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 pt-1 text-xs text-slate-600 font-medium">
              {profile?.location && (
                <span className="inline-flex items-center gap-1.5">
                  <span>📍</span>
                  <span>{profile.location}</span>
                </span>
              )}
              {profile?.college && (
                <span className="inline-flex items-center gap-1.5">
                  <span>🎓</span>
                  <span>{profile.college}</span>
                </span>
              )}
              {profile?.email && (
                <span className="inline-flex items-center gap-1.5 text-slate-500">
                  <span>✉️</span>
                  <span>{profile.email}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Columns: About & Skills */}
        <div className="md:col-span-2 space-y-6">
          {/* ── 2. About / Bio Card ──────────────────────────────────────── */}
          <div className="card-base p-6 space-y-3">
            <div className="flex items-center justify-between border-b border-warm-border pb-2.5">
              <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <span>📝</span>
                <span>About</span>
              </h2>
            </div>
            {profile?.bio ? (
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {profile.bio}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">
                No bio provided yet. Click &quot;Edit Profile&quot; to introduce yourself to prospective recruiters.
              </p>
            )}
          </div>

          {/* ── 3. Skills Card ──────────────────────────────────────────── */}
          <div className="card-base p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-warm-border pb-2.5">
              <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <span>⚡</span>
                <span>Skills ({skillsList.length})</span>
              </h2>
              <span className="text-[11px] text-slate-400">Used for AI SBERT semantic matching</span>
            </div>

            {/* Interactive Chips */}
            <div className="flex flex-wrap gap-2">
              {skillsList.length > 0 ? (
                skillsList.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-800 border border-primary-200/80 shadow-2xs group hover:bg-primary-100/70 transition-colors"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      aria-label={`Remove ${skill}`}
                      className="ml-0.5 text-primary-500 hover:text-rose-600 hover:bg-rose-50 rounded-full p-0.5 transition"
                    >
                      ✕
                    </button>
                  </span>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No skills listed. Add your core technical and professional skills below.
                </p>
              )}
            </div>

            {/* Quick Add Skill Form */}
            <form onSubmit={handleAddSkill} className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                placeholder="e.g. Docker, TypeScript, Microservices…"
                className="w-full rounded-xl border border-warm-border bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 transition focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
              />
              <MotionButton
                type="submit"
                variant="secondary"
                disabled={!newSkillInput.trim() || savingSkill}
                className="text-xs px-4 py-2 flex-shrink-0"
              >
                {savingSkill ? 'Adding…' : '+ Add Skill'}
              </MotionButton>
            </form>
          </div>

          {/* ── 4. Professional Links Card ──────────────────────────────── */}
          <div className="card-base p-6 space-y-3">
            <div className="flex items-center justify-between border-b border-warm-border pb-2.5">
              <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <span>🔗</span>
                <span>Professional Links</span>
              </h2>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">GitHub:</span>
                  {profile?.githubUrl ? (
                    <a
                      href={profile.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-700 hover:underline font-medium break-all"
                    >
                      {profile.githubUrl} ↗
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">Not specified</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">LinkedIn:</span>
                  {profile?.linkedinUrl ? (
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-700 hover:underline font-medium break-all"
                    >
                      {profile.linkedinUrl} ↗
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">Not specified</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">Portfolio:</span>
                  {profile?.portfolioUrl ? (
                    <a
                      href={profile.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-700 hover:underline font-medium break-all"
                    >
                      {profile.portfolioUrl} ↗
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">Not specified</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Preferences & Resume */}
        <div className="space-y-6">
          {/* ── 5. Internship Preferences Card ──────────────────────────── */}
          <div className="card-base p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-warm-border pb-2.5">
              <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <span>🌍</span>
                <span>Internship Preferences</span>
              </h2>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Countries:</span>
                <span className="font-semibold text-slate-800 text-right">
                  {preferences?.preferredCountries || 'Any / Flexible'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Work Mode:</span>
                <span className="font-semibold text-slate-800">
                  {preferences?.workMode || 'REMOTE'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Min Stipend:</span>
                <span className="font-semibold text-slate-800">
                  {preferences?.minimumStipend
                    ? `${preferences.minimumStipend} /mo`
                    : 'Flexible'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Duration:</span>
                <span className="font-semibold text-slate-800">
                  {preferences?.duration || 'Flexible'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Relocation:</span>
                <span className="font-semibold text-slate-800">
                  {preferences?.relocationPreference ? 'Willing to Relocate' : 'Remote Only'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Visa Guidance:</span>
                <span className="font-semibold text-slate-800">
                  {preferences?.visaRequired ? 'Preferred' : 'Not Required'}
                </span>
              </div>
            </div>

            <MotionButton
              onClick={() => setIsPrefModalOpen(true)}
              variant="secondary"
              className="w-full text-xs py-2 mt-2"
            >
              ⚙️ Edit Preferences
            </MotionButton>
          </div>

          {/* ── 6. Resume Card ──────────────────────────────────────────── */}
          <div className="card-base p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-warm-border pb-2.5">
              <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <span>📄</span>
                <span>Active Resume</span>
              </h2>
            </div>

            {profile?.resumeFileName ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-2xl">📑</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {profile.resumeFileName}
                    </p>
                    <p className="text-[10px] text-slate-400">PDF Document (active)</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <MotionButton
                    type="button"
                    onClick={handleViewResume}
                    disabled={viewingResume}
                    variant="secondary"
                    className="text-xs py-2"
                  >
                    {viewingResume ? 'Opening…' : '👁 View Resume'}
                  </MotionButton>
                  <MotionButton
                    type="button"
                    onClick={() => resumeInputRef.current?.click()}
                    disabled={uploadingResume}
                    variant="primary"
                    className="text-xs py-2"
                  >
                    {uploadingResume ? 'Uploading…' : '🔄 Replace'}
                  </MotionButton>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-center py-2">
                <p className="text-xs text-slate-500">
                  No resume uploaded yet. Upload a PDF to unlock AI-powered semantic recommendations.
                </p>
                <MotionButton
                  type="button"
                  onClick={() => resumeInputRef.current?.click()}
                  disabled={uploadingResume}
                  variant="primary"
                  className="w-full text-xs py-2"
                >
                  {uploadingResume ? 'Uploading…' : '📤 Upload Resume'}
                </MotionButton>
              </div>
            )}

            {/* Hidden resume input */}
            <input
              type="file"
              ref={resumeInputRef}
              onChange={handleResumeFileSelect}
              accept="application/pdf"
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* ── Edit Profile Modal ────────────────────────────────────────────── */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
        onSaved={(updated) => {
          setProfile(updated)
          setPhotoError(false)
          showToast('Profile updated successfully!')
        }}
      />

      {/* ── Shared International Preferences Modal ──────────────────────── */}
      <PreferencesModal
        isOpen={isPrefModalOpen}
        onClose={() => setIsPrefModalOpen(false)}
        onSaved={async () => {
          const res = await getStudentPreferences()
          setPreferences(res.data)
          showToast('Preferences updated successfully!')
        }}
      />
    </div>
  )
}

// ── Edit Profile Modal Component ───────────────────────────────────────────

function EditProfileModal({ isOpen, onClose, profile, onSaved }) {
  const [formData, setFormData] = useState({
    name: '',
    professionalHeadline: '',
    location: '',
    college: '',
    bio: '',
    githubUrl: '',
    linkedinUrl: '',
    portfolioUrl: '',
  })
  const [photoPreview, setPhotoPreview] = useState(null)
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const photoInputRef = useRef(null)

  useEffect(() => {
    if (isOpen && profile) {
      setFormData({
        name: profile.name || '',
        professionalHeadline: profile.professionalHeadline || '',
        location: profile.location || '',
        college: profile.college || '',
        bio: profile.bio || '',
        githubUrl: profile.githubUrl || '',
        linkedinUrl: profile.linkedinUrl || '',
        portfolioUrl: profile.portfolioUrl || '',
      })
      setPhotoPreview(profile.profilePhotoUrl || null)
      setSelectedPhotoFile(null)
      setErrorMsg('')
    }
  }, [isOpen, profile])

  if (!isOpen) return null

  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  function handlePhotoSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type.toLowerCase())) {
      setErrorMsg('Please select a valid image file (JPEG, PNG, WEBP, GIF).')
      return
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setErrorMsg(`Photo file is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum is 2 MB.`)
      return
    }

    setSelectedPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    setErrorMsg('')
  }

  async function handleRemovePhoto() {
    try {
      const res = await removeProfilePhoto()
      setPhotoPreview(null)
      setSelectedPhotoFile(null)
      if (photoInputRef.current) photoInputRef.current.value = ''
      onSaved(res.data)
    } catch {
      setErrorMsg('Failed to remove profile photo.')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formData.name.trim()) {
      setErrorMsg('Name is required.')
      return
    }

    setSaving(true)
    setErrorMsg('')
    try {
      // 1. Upload photo if a new file was chosen
      let updatedProfile = profile
      if (selectedPhotoFile) {
        const photoRes = await uploadProfilePhoto(selectedPhotoFile)
        updatedProfile = photoRes.data
      }

      // 2. Update profile fields
      const res = await updateStudentProfile({
        name: formData.name.trim(),
        professionalHeadline: formData.professionalHeadline.trim() || null,
        location: formData.location.trim() || null,
        college: formData.college.trim() || null,
        bio: formData.bio.trim() || null,
        githubUrl: formData.githubUrl.trim() || null,
        linkedinUrl: formData.linkedinUrl.trim() || null,
        portfolioUrl: formData.portfolioUrl.trim() || null,
      })

      onSaved(res.data)
      onClose()
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile. Please check inputs.')
    } finally {
      setSaving(false)
    }
  }

  const INPUT_CLASS =
    'w-full rounded-xl border border-warm-border bg-white px-3.5 py-2 text-xs text-slate-800 transition focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20'
  const LABEL_CLASS = 'block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="card-base w-full max-w-xl bg-white p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-warm-border pb-3">
          <div>
            <h3 className="font-heading text-lg font-bold text-slate-900">Edit Student Profile</h3>
            <p className="text-xs text-slate-500">Update your basic student information and links.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo upload section */}
          <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            {photoPreview ? (
              <img
                src={resolvePhotoUrl(photoPreview)}
                alt="Profile Preview"
                className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-2xs"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400 text-2xl font-bold">
                📷
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="file"
                ref={photoInputRef}
                onChange={handlePhotoSelect}
                accept="image/png, image/jpeg, image/webp, image/gif"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="px-3 py-1.5 text-xs font-semibold text-primary-700 bg-white border border-primary-200 rounded-xl hover:bg-primary-50 transition cursor-pointer"
              >
                Change Photo
              </button>
              {photoPreview && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-white border border-rose-200 rounded-xl hover:bg-rose-50 transition cursor-pointer"
                >
                  Remove Photo
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS} htmlFor="edit-name">
                Full Name *
              </label>
              <input
                id="edit-name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Charlie Student"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS} htmlFor="edit-headline">
                Professional Headline
              </label>
              <input
                id="edit-headline"
                name="professionalHeadline"
                value={formData.professionalHeadline}
                onChange={handleChange}
                placeholder="e.g. Full Stack Java Developer | React Enthusiast"
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS} htmlFor="edit-location">
                Location
              </label>
              <input
                id="edit-location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Berlin, Germany or Bangalore, India"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS} htmlFor="edit-college">
                College / University
              </label>
              <input
                id="edit-college"
                name="college"
                value={formData.college}
                onChange={handleChange}
                placeholder="e.g. Technical University of Munich"
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS} htmlFor="edit-bio">
              Short About / Bio
            </label>
            <textarea
              id="edit-bio"
              name="bio"
              rows={4}
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell recruiters about your interests, motivations, and what kind of internships you're looking for…"
              className={INPUT_CLASS}
            />
          </div>

          <div className="space-y-3 pt-1 border-t border-warm-border">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Social &amp; Professional Links
            </span>
            <div className="space-y-2">
              <div>
                <label className={LABEL_CLASS} htmlFor="edit-github">
                  GitHub URL
                </label>
                <input
                  id="edit-github"
                  name="githubUrl"
                  value={formData.githubUrl}
                  onChange={handleChange}
                  placeholder="https://github.com/username"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS} htmlFor="edit-linkedin">
                  LinkedIn URL
                </label>
                <input
                  id="edit-linkedin"
                  name="linkedinUrl"
                  value={formData.linkedinUrl}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/username"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS} htmlFor="edit-portfolio">
                  Portfolio / Personal Website URL
                </label>
                <input
                  id="edit-portfolio"
                  name="portfolioUrl"
                  value={formData.portfolioUrl}
                  onChange={handleChange}
                  placeholder="https://myportfolio.com"
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-warm-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <MotionButton
              type="submit"
              variant="primary"
              disabled={saving}
              className="text-xs"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </MotionButton>
          </div>
        </form>
      </div>
    </div>
  )
}
