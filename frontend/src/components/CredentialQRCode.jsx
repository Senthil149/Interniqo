import { useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'

/**
 * Reusable Blockchain Credential QR Code component.
 * Encodes strictly the public verification URL.
 * Never encodes secrets, JWTs, passwords, or sensitive account info.
 */
export default function CredentialQRCode({
  credentialId,
  size = 180,
  showDetails = true,
  showCopy = true,
  showDownload = true,
  className = '',
}) {
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const qrWrapperRef = useRef(null)

  if (!credentialId) return null

  const baseUrl =
    import.meta.env.VITE_FRONTEND_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173')

  const verificationUrl = `${baseUrl}/verify-credential/${encodeURIComponent(credentialId)}`
  const uniqueDomId = `qr-svg-${credentialId.replace(/[^a-zA-Z0-9_-]/g, '')}`

  function handleCopy() {
    navigator.clipboard.writeText(verificationUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  function handleDownload() {
    try {
      setDownloading(true)
      const svgElement = qrWrapperRef.current?.querySelector('svg')
      if (!svgElement) return

      const svgData = new XMLSerializer().serializeToString(svgElement)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      const canvasWidth = size * 2
      const canvasHeight = size * 2
      canvas.width = canvasWidth
      canvas.height = canvasHeight

      img.onload = () => {
        // Draw white background
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvasWidth, canvasHeight)
        // Draw QR code image
        ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)

        const pngUrl = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.download = `interniqo-credential-${credentialId}.png`
        link.href = pngUrl
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        setDownloading(false)
      }

      img.onerror = () => setDownloading(false)
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
    } catch {
      setDownloading(false)
    }
  }

  return (
    <div
      className={`flex flex-col items-center text-center p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs ${className}`}
      data-testid="credential-qr-container"
    >
      {/* QR Code Container */}
      <div
        ref={qrWrapperRef}
        className="p-3 bg-white rounded-xl border border-slate-100 shadow-inner inline-flex items-center justify-center transition hover:shadow-xs"
      >
        <QRCodeSVG
          id={uniqueDomId}
          value={verificationUrl}
          size={size}
          level="H"
          includeMargin={true}
          bgColor="#ffffff"
          fgColor="#0f172a"
          data-testid="credential-qr-svg"
          data-verification-url={verificationUrl}
        />
      </div>

      {/* Caption & Security Notice */}
      <p className="mt-3 text-[11px] font-medium text-slate-500 max-w-xs leading-tight">
        Scan to independently verify this credential on the public blockchain registry.
      </p>

      {/* Verification URL and Details */}
      {showDetails && (
        <div className="mt-3 w-full space-y-2 text-left">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Public Verification Link
            </span>
            <p
              className="text-xs font-mono text-primary-700 break-all select-all mt-0.5"
              data-testid="qr-verification-url-text"
            >
              {verificationUrl}
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {(showCopy || showDownload) && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 w-full">
          {showCopy && (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer shadow-2xs active:scale-95"
              data-testid="copy-qr-link-btn"
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-emerald-700 font-bold">✓ Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copy Link</span>
                </>
              )}
            </button>
          )}

          {showDownload && (
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-primary-300 bg-primary-50 text-primary-800 hover:bg-primary-100 transition cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
              data-testid="download-qr-btn"
            >
              <svg className="w-3.5 h-3.5 text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>{downloading ? 'Preparing…' : 'Download QR'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
