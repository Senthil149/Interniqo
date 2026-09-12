import { useEffect, useRef, useState } from 'react'
import { getStudentProfile, uploadResume } from '../../api/student.js'
import SkeletonLoader from '../../components/SkeletonLoader.jsx'

const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5 MB — matches backend hard limit

const PROFILE_FIELDS = [
  { key: 'skills', label: 'Technical & Professional Skills', icon: '⚡' },
  { key: 'education', label: 'Education & Academic History', icon: '🎓' },
  { key: 'experience', label: 'Professional Experience', icon: '💼' },
  { key: 'projects', label: 'Academic & Personal Projects', icon: '🛠' },
  { key: 'certifications', label: 'Licenses & Certifications', icon: '🏆' },
  { key: 'interests', label: 'Domain Interests', icon: '✨' },
]

function ExtractionCard({ label, icon, value }) {
  return (
    <div className="card-base card-hover p-5 space-y-2">
      <h3 className="flex items-center gap-2 font-heading text-sm font-bold text-slate-800">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 text-sm">
          {icon}
        </span>
        {label}
      </h3>
      {value ? (
        <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
          {value}
        </p>
      ) : (
        <p className="text-xs italic text-slate-400 bg-slate-50/40 p-3 rounded-xl border border-dashed border-slate-200">
          Not detected in uploaded document
        </p>
      )}
    </div>
  )
}

function ResumeUploadPage() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [aiSucceeded, setAiSucceeded] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const fileInputRef = useRef(null)

  useEffect(() => {
    getStudentProfile()
      .then(({ data }) => setProfile(data))
      .catch(() => {})
      .finally(() => setProfileLoading(false))
  }, [])

  function handleFileChange(e) {
    setFileError('')
    setUploadError('')
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setFileError('Only PDF files are accepted.')
      setSelectedFile(null)
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

  async function handleUpload(e) {
    e.preventDefault()
    if (!selectedFile) return
    setUploadError('')
    setUploading(true)
    try {
      const { data } = await uploadResume(selectedFile)
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

  const hasStoredData =
    profile != null && PROFILE_FIELDS.some(({ key }) => profile[key] != null)

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-fade-in">
      {/* Page header */}
      <div className="border-b border-slate-200/80 pb-5">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          My Resume &amp; Skills Profile
        </h1>
        <p className="mt-1 text-sm text-slate-500 max-w-2xl">
          Upload your PDF resume to auto-populate your extracted skills and vector embeddings. The NLP extraction is an automated first-pass heuristic used by the SBERT engine to rank opportunities.
        </p>
      </div>

      {/* Upload card */}
      <div className="card-base p-6 sm:p-8 space-y-5">
        <h2 className="font-heading text-base font-bold text-slate-900">Upload PDF Resume</h2>

        <form onSubmit={handleUpload} className="space-y-4" noValidate>
          {/* Drop zone / file picker */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`w-full rounded-2xl border-2 border-dashed px-6 py-12 text-center transition cursor-pointer ${
              selectedFile
                ? 'border-blue-400 bg-blue-50/60'
                : 'border-slate-200 bg-slate-50/70 hover:border-blue-300 hover:bg-blue-50/30'
            }`}
          >
            <span className="block text-4xl mb-2">📄</span>
            {selectedFile ? (
              <span className="mt-2 block space-y-1">
                <span className="text-sm font-bold text-blue-700">{selectedFile.name}</span>
                <span className="block text-xs text-slate-500">
                  Ready for analysis ({(selectedFile.size / 1024).toFixed(0)} KB)
                </span>
              </span>
            ) : (
              <span className="mt-2 block space-y-1">
                <span className="text-sm font-bold text-slate-700">
                  Click or drop your PDF document here
                </span>
                <span className="block text-xs text-slate-400">
                  Maximum file size: 5 MB · PDF format only
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

          {fileError && (
            <p className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
              {fileError}
            </p>
          )}

          {uploadError && (
            <p className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
              {uploadError}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className="btn-primary text-xs"
            >
              {uploading ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin text-white mr-2" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Extracting NLP Entities…
                </>
              ) : (
                'Upload & Parse Resume'
              )}
            </button>
            {selectedFile && !uploading && (
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null)
                  setFileError('')
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {profile?.resumeFileName && (
          <p className="pt-2 text-xs text-slate-400 border-t border-slate-100 flex items-center gap-2">
            <span className="font-semibold text-slate-600">Active Document:</span>
            <span className="font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{profile.resumeFileName}</span>
          </p>
        )}
      </div>

      {/* AI extraction status banner */}
      {aiSucceeded !== null && (
        <div
          className={`flex items-start gap-3 rounded-2xl p-4 text-xs animate-scale-in border ${
            aiSucceeded
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
        >
          <span className="text-base">{aiSucceeded ? '✅' : '⚠️'}</span>
          <div>
            {aiSucceeded ? (
              <>
                <p className="font-bold">Resume Parsing Completed Successfully</p>
                <p className="mt-0.5 opacity-85 leading-relaxed">
                  Extracted sections below will feed directly into the SBERT recommendation matcher. You can re-upload anytime to update your profile.
                </p>
              </>
            ) : (
              <>
                <p className="font-bold">NLP Parsing Service Warning</p>
                <p className="mt-0.5 opacity-85 leading-relaxed">
                  Your PDF was safely persisted on the server, but automated entity extraction could not be reached. Try re-uploading when the AI service is active.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Extracted profile sections */}
      {profileLoading ? (
        <div className="space-y-4">
          <div className="h-5 w-40 rounded bg-slate-200 animate-pulse" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SkeletonLoader variant="card" count={4} />
          </div>
        </div>
      ) : hasStoredData ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-heading text-lg font-bold text-slate-900">
              Parsed Resume Data
            </h2>
            <p className="text-xs text-slate-400">
              Automated first-pass extraction · SBERT embedding ready
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
        <div className="card-base flex flex-col items-center justify-center border-dashed py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-400 mb-3">
            📋
          </div>
          <p className="font-heading font-bold text-slate-700">No profile data extracted yet.</p>
          <p className="mt-1 text-xs text-slate-400 max-w-sm">
            Upload your PDF resume above to auto-populate your skills, education, and project background.
          </p>
        </div>
      )}
    </div>
  )
}

export default ResumeUploadPage
