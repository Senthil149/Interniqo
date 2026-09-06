import { useEffect, useRef, useState } from 'react'
import { getStudentProfile, uploadResume } from '../../api/student.js'

const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5 MB — matches backend hard limit

/**
 * Profile sections displayed after upload or on page load.
 * NOTE: The order here determines the display order.
 */
const PROFILE_FIELDS = [
  { key: 'skills',          label: 'Skills',          icon: '⚡' },
  { key: 'education',       label: 'Education',       icon: '🎓' },
  { key: 'experience',      label: 'Experience',      icon: '💼' },
  { key: 'projects',        label: 'Projects',        icon: '🛠' },
  { key: 'certifications',  label: 'Certifications',  icon: '🏆' },
  { key: 'interests',       label: 'Interests',       icon: '✨' },
]

function ExtractionCard({ label, icon, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
        <span className="text-base">{icon}</span>
        {label}
      </h3>
      {value ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{value}</p>
      ) : (
        <p className="text-sm italic text-slate-400">Not detected in resume</p>
      )}
    </div>
  )
}

function ResumeUploadPage() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileError, setFileError]       = useState('')
  const [uploading, setUploading]       = useState(false)
  const [uploadError, setUploadError]   = useState('')
  // null = no upload attempted this session; true/false = last upload result
  const [aiSucceeded, setAiSucceeded]   = useState(null)
  // profile data from last upload OR from GET /profile on mount
  const [profile, setProfile]           = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const fileInputRef = useRef(null)

  // Load existing profile data on mount so the student can see what's stored
  useEffect(() => {
    getStudentProfile()
      .then(({ data }) => setProfile(data))
      .catch(() => {}) // Not fatal — empty profile is fine
      .finally(() => setProfileLoading(false))
  }, [])

  // ── File selection ──────────────────────────────────────────────────────

  function handleFileChange(e) {
    setFileError('')
    setUploadError('')
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setFileError('Only PDF files are accepted.')
      setSelectedFile(null)
      // Reset input so the same file can be re-selected after fixing
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setFileError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum is 5 MB.`)
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    setSelectedFile(file)
  }

  // ── Upload ──────────────────────────────────────────────────────────────

  async function handleUpload(e) {
    e.preventDefault()
    if (!selectedFile) return
    setUploadError('')
    setUploading(true)
    try {
      const { data } = await uploadResume(selectedFile)
      // Response shape matches ResumeUploadResponse DTO
      setProfile(data)
      setAiSucceeded(data.aiExtractionSucceeded)
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setUploadError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Upload failed — please check the file and try again.'
      )
    } finally {
      setUploading(false)
    }
  }

  // ── Derived state ───────────────────────────────────────────────────────

  const hasStoredData =
    profile != null && PROFILE_FIELDS.some(({ key }) => profile[key] != null)

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-4xl space-y-8">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Resume</h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload your PDF resume to auto-populate your profile. The AI extraction is a{' '}
          <strong>best-effort first pass</strong> — accuracy varies by resume format.
          Always review the extracted fields before they are used for matching.
        </p>
      </div>

      {/* ── Upload card ──────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-base font-semibold text-slate-800">Upload PDF Resume</h2>

        <form onSubmit={handleUpload} className="space-y-4" noValidate>
          {/* Drop zone / file picker */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`w-full rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
              selectedFile
                ? 'border-indigo-300 bg-indigo-50'
                : 'border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50'
            }`}
          >
            <span className="block text-3xl">📄</span>
            {selectedFile ? (
              <span className="mt-2 block">
                <span className="text-sm font-semibold text-indigo-700">{selectedFile.name}</span>
                <span className="ml-2 text-xs text-slate-400">
                  ({(selectedFile.size / 1024).toFixed(0)} KB)
                </span>
              </span>
            ) : (
              <span className="mt-2 block">
                <span className="text-sm font-medium text-slate-600">
                  Click to choose a PDF file
                </span>
                <span className="mt-0.5 block text-xs text-slate-400">
                  Maximum 5 MB · PDF only
                </span>
              </span>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Client-side validation error */}
          {fileError && (
            <p className="text-sm font-medium text-red-600">{fileError}</p>
          )}

          {/* Server-side upload error */}
          {uploadError && (
            <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
              {uploadError}
            </p>
          )}

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {uploading ? 'Uploading & Extracting…' : 'Upload & Extract'}
            </button>
            {selectedFile && !uploading && (
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null)
                  setFileError('')
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className="text-sm text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {/* Current file indicator */}
        {profile?.resumeFileName && (
          <p className="mt-4 text-xs text-slate-400">
            Current resume on file:{' '}
            <span className="font-medium text-slate-500">{profile.resumeFileName}</span>
          </p>
        )}
      </div>

      {/* ── AI extraction status badge ──────────────────────────────── */}
      {aiSucceeded !== null && (
        <div
          className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm ${
            aiSucceeded
              ? 'bg-emerald-50 text-emerald-800'
              : 'bg-amber-50 text-amber-800'
          }`}
        >
          <span className="mt-0.5 text-base">{aiSucceeded ? '✅' : '⚠️'}</span>
          <div>
            {aiSucceeded ? (
              <>
                <p className="font-semibold">Extraction completed.</p>
                <p className="text-xs mt-0.5 opacity-80">
                  {/*
                    NOTE: This is a first-pass heuristic. Results depend heavily on
                    resume format. TODO(measure after real evaluation): benchmark accuracy
                    against a labelled corpus before using these fields for matching.
                  */}
                  Review the fields below — this is a best-effort first pass.
                  Accuracy varies by resume format and may miss sections.
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold">AI service was unavailable.</p>
                <p className="text-xs mt-0.5 opacity-80">
                  Your resume was saved but extraction did not run.
                  Try uploading again when the AI service is running.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Extracted profile sections ──────────────────────────────── */}
      {profileLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PROFILE_FIELDS.map(({ key }) => (
            <div key={key} className="h-28 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : hasStoredData ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Extracted Profile</h2>
            <p className="text-xs text-slate-400">
              {/* Reminder in UI as well */}
              Best-effort extraction · review before relying on these values
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {PROFILE_FIELDS.map(({ key, label, icon }) => (
              <ExtractionCard
                key={key}
                label={label}
                icon={icon}
                value={profile?.[key]}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Empty state — no upload yet or AI returned all nulls */
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <p className="font-medium text-slate-500">No extracted data yet.</p>
          <p className="mt-1 text-sm text-slate-400">
            Upload a PDF resume above to auto-populate your profile.
          </p>
        </div>
      )}
    </div>
  )
}

export default ResumeUploadPage
