import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { verifyCredential } from '../api/credentials.js'
import SkeletonLoader from '../components/SkeletonLoader.jsx'
import { MotionButton } from '../components/MotionButton.jsx'

export default function VerifyCredentialPage() {
  const { credentialId: paramId } = useParams()
  const navigate = useNavigate()

  const [inputVal, setInputVal] = useState(paramId || '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [copiedTx, setCopiedTx] = useState(false)

  useEffect(() => {
    if (paramId) {
      setInputVal(paramId)
      performVerification(paramId)
    }
  }, [paramId])

  async function performVerification(idToVerify) {
    const cleanId = (idToVerify || '').trim()
    if (!cleanId) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await verifyCredential(cleanId)
      setResult(res.data)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to reach verification service. Please try again in a few moments.'
      )
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e) {
    e.preventDefault()
    if (!inputVal.trim()) return
    navigate(`/verify-credential/${encodeURIComponent(inputVal.trim())}`)
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
    setCopiedTx(true)
    setTimeout(() => setCopiedTx(false), 2000)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-4 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-3">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50/80 px-3.5 py-1 text-xs font-semibold text-primary-800 shadow-2xs"
        >
          <span className="flex h-2 w-2 rounded-full bg-primary-600 animate-pulse" />
          <span>Instant Credential Verification</span>
        </motion.div>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Public Credential Verification
        </h1>
        <p className="mx-auto max-w-2xl text-sm text-slate-600 leading-relaxed">
          Verify the authenticity, integrity, and official record of any internship certificate issued on Interniqo. No login required.
        </p>
      </div>

      {/* Search Input Box */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-base border-primary-100 bg-white p-5 sm:p-7 shadow-xs"
      >
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Enter Credential ID (e.g. CRED-A1B2C3D4E5F6)..."
              className="w-full rounded-xl border border-warm-border py-3 pl-11 pr-4 text-sm font-mono transition focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20 shadow-2xs"
            />
          </div>
          <MotionButton
            type="submit"
            disabled={loading || !inputVal.trim()}
            className="btn-primary text-sm px-6 py-3 flex items-center justify-center gap-2 shrink-0"
            pulse={Boolean(inputVal.trim())}
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z" />
                </svg>
                  <span>Verifying Credential…</span>
              </>
            ) : (
              'Verify Credential'
            )}
          </MotionButton>
        </form>
      </motion.div>

      {/* Network Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-danger-200 bg-danger-50 p-5 text-sm text-danger-700"
          >
            <p className="font-bold flex items-center gap-2">
              <span>⚠️</span> Verification Service Notice
            </p>
            <p className="mt-1">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category 2: Content-shaped Skeleton Loading state */}
      {loading && (
        <div className="space-y-4">
          <SkeletonLoader variant="detail-header" count={1} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkeletonLoader variant="card" count={2} />
          </div>
        </div>
      )}

      {/* Category 6: Verification Results scale (0.95->1) + fade entrance */}
      {result && !loading && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="space-y-6"
        >
          {/* Status 1: VERIFIED */}
          {result.status === 'VERIFIED' && (
            <div className="overflow-hidden rounded-3xl border-2 border-emerald-500/30 bg-white shadow-xl">
              {/* Green Header Banner */}
              <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-6 py-6 text-white">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-white/20 p-2.5 backdrop-blur-xs shadow-inner">
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <span className="inline-block rounded-full bg-white/25 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider">
                        Cryptographically Verified
                      </span>
                      <h2 className="font-heading text-2xl font-bold mt-1">
                        Authentic Internship Credential
                      </h2>
                    </div>
                  </div>

                  {/* Stamp */}
                  <div className="rounded-xl border border-white/30 bg-white/10 px-3.5 py-1.5 text-center text-xs backdrop-blur-xs">
                    <div className="font-bold uppercase tracking-wider text-[10px] text-emerald-100">Status</div>
                    <div className="font-bold text-white">OFFICIALLY VERIFIED</div>
                  </div>
                </div>
              </div>

              {/* Certificate Details Body */}
              <div className="p-6 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
                    <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                      Student Recipient
                    </h3>
                    <p className="mt-1 font-heading text-lg font-bold text-slate-900">
                      {result.platformRecord?.studentName || 'Recipient'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
                    <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                      Issuing Company
                    </h3>
                    <p className="mt-1 font-heading text-lg font-bold text-slate-900">
                      {result.platformRecord?.companyName || result.onChainRecord?.issuer || 'Issuer'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
                    <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                      Internship Position
                    </h3>
                    <p className="mt-1 text-base font-semibold text-slate-800">
                      {result.platformRecord?.internshipTitle || 'Internship Program'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
                    <h3 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                      Completion Record Date
                    </h3>
                    <p className="mt-1 text-base font-medium text-slate-700">
                      {result.platformRecord?.completionDate || 'Recorded'}
                    </p>
                  </div>
                </div>

                {/* Blockchain Proof Card */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Digital Verification Proof
                      </h4>
                    </div>
                    <span className="rounded-full bg-slate-200/80 px-3 py-0.5 text-xs font-mono font-medium text-slate-700">
                      Registry: {result.onChainRecord?.network || 'Verified Ledger'}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-500 font-medium">Credential ID:</span>
                      <p className="font-mono font-bold text-slate-900 mt-0.5 text-sm">{result.credentialId}</p>
                    </div>

                    <div>
                      <span className="text-slate-500 font-medium">Canonical SHA-256 Hash:</span>
                      <p className="font-mono text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 break-all mt-1">
                        {result.onChainRecord?.credentialHash}
                      </p>
                    </div>

                    {result.platformRecord?.transactionHash && (
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Transaction Hash:</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(result.platformRecord.transactionHash)}
                            className="text-blue-600 hover:text-blue-800 text-[11px] font-semibold transition cursor-pointer"
                          >
                            {copiedTx ? '✓ Copied to Clipboard' : 'Copy Hash'}
                          </button>
                        </div>
                        <p className="font-mono text-slate-800 bg-white border border-slate-200 rounded-xl p-2.5 break-all mt-1">
                          {result.platformRecord.transactionHash}
                        </p>
                      </div>
                    )}

                    {result.onChainRecord?.contractAddress && (
                      <div>
                        <span className="text-slate-500 font-medium">Registry Contract:</span>
                        <p className="font-mono text-slate-700 bg-white border border-slate-200 rounded-xl p-2.5 break-all mt-1">
                          {result.onChainRecord.contractAddress}
                        </p>
                      </div>
                    )}

                    {result.onChainRecord?.timestamp && (
                      <div>
                        <span className="text-slate-500 font-medium">Verification Timestamp:</span>
                        <p className="text-slate-700 font-medium mt-1">
                          {new Date(result.onChainRecord.timestamp).toUTCString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status 2: MISMATCH */}
          {result.status === 'MISMATCH' && (
            <div className="overflow-hidden rounded-3xl border border-rose-300 bg-white shadow-lg">
              <div className="border-b border-rose-200 bg-rose-600 px-6 py-5 text-white">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white/20 p-2.5 backdrop-blur-xs">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <span className="inline-block rounded-full bg-white/25 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
                      Verification Failed
                    </span>
                    <h2 className="font-heading text-xl font-bold mt-0.5">Cryptographic Hash Mismatch</h2>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-rose-700 leading-relaxed">
                  {result.message}
                </p>

                <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 space-y-3 text-xs">
                  <div>
                    <span className="font-semibold text-rose-800">Platform Database Hash:</span>
                    <p className="font-mono text-slate-800 bg-white border border-slate-200 rounded-lg p-2 break-all mt-1">
                      {result.platformRecord?.platformHash || '(None recorded)'}
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-rose-800">Registry Hash:</span>
                    <p className="font-mono text-slate-800 bg-white border border-slate-200 rounded-lg p-2 break-all mt-1">
                      {result.onChainRecord?.credentialHash || '(None recorded)'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status 3: NOT_FOUND */}
          {result.status === 'NOT_FOUND' && (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="font-heading mt-4 text-lg font-bold text-slate-900">Credential Not Found</h2>
              <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                {result.message}
              </p>
              <p className="mt-3 text-xs text-slate-400">
                Queried ID: <span className="font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{result.credentialId}</span>
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
