import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'

export default function HomePage() {
  const { isAuthenticated, user } = useAuth()

  return (
    <div className="space-y-16 py-4 animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-b from-blue-50/70 via-white to-white p-8 sm:p-14 text-center shadow-xs">
        {/* Subtle background glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-96 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-10 h-64 w-64 rounded-full bg-amber-300/15 blur-3xl" />

        <div className="relative mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-3.5 py-1 text-xs font-semibold text-blue-700 shadow-2xs backdrop-blur">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping" />
            <span>AI Semantic Matching • Web3 Credentials • IEEE Project Demo</span>
          </div>

          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-[1.15]">
            Next-Gen Internship Discovery &amp;{' '}
            <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Cryptographic Verification
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-base text-slate-600 sm:text-lg leading-relaxed">
            Bridge academic talent and global industry with SBERT deep semantic embeddings, automated multi-signal risk assessments, and tamper-proof Ethereum smart contract credentials.
          </p>

          {/* Primary Calls to Action */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-primary text-base px-6 py-3">
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-primary text-base px-6 py-3">
                  Get Started Free →
                </Link>
                <Link to="/login" className="btn-secondary text-base px-6 py-3">
                  Sign In
                </Link>
              </>
            )}
            <Link
              to="/verify-credential"
              className="btn-accent text-base px-6 py-3"
            >
              Verify Credential
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive System Pipeline (Architecture Showcase for IEEE Evaluators) */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            End-to-End System Architecture
          </h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            How candidate resumes flow from deep natural language embeddings to immutable on-chain credentialing.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* Step 1 */}
          <div className="card-base card-hover relative flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 font-heading font-bold text-sm">
                01
              </div>
              <h3 className="font-heading font-semibold text-slate-900">Resume PDF Parsing</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Extracts key skills, education, projects, and work experience using contextual NLP without manual data entry.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-blue-600">
              PDFBox &amp; Regex Normalizer
            </div>
          </div>

          {/* Step 2 */}
          <div className="card-base card-hover relative flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 font-heading font-bold text-sm">
                02
              </div>
              <h3 className="font-heading font-semibold text-slate-900">SBERT Embeddings</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Generates 384-dimensional dense semantic vectors and computes real-time cosine similarity against active listings.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-blue-600">
              all-MiniLM-L6-v2 Model
            </div>
          </div>

          {/* Step 3 */}
          <div className="card-base card-hover relative flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 font-heading font-bold text-sm">
                03
              </div>
              <h3 className="font-heading font-semibold text-slate-900">Risk &amp; Domain Heuristics</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automated multi-factor audit evaluating stipend outliers, suspicious contacts, domain type, and website correspondence.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-amber-600">
              Design Rules #3 &amp; #4 Signals
            </div>
          </div>

          {/* Step 4 */}
          <div className="card-base card-hover relative flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-heading font-bold text-sm">
                04
              </div>
              <h3 className="font-heading font-semibold text-slate-900">Blockchain Minting</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Issues tamper-proof completion certificates recorded on Ethereum smart contracts with public cryptographic verification.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-emerald-600">
              ERC-721 Immutable Ledger
            </div>
          </div>
        </div>
      </section>

      {/* Live System Performance & Metrics */}
      <section className="rounded-3xl bg-slate-900 text-white p-8 sm:p-12 shadow-md">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 text-center">
          <div className="space-y-1">
            <div className="font-heading text-3xl sm:text-4xl font-extrabold text-blue-400">
              384
            </div>
            <div className="text-xs sm:text-sm font-medium text-slate-300">Vector Dimensions</div>
            <div className="text-[11px] text-slate-500">SBERT Sentence Embeddings</div>
          </div>
          <div className="space-y-1">
            <div className="font-heading text-3xl sm:text-4xl font-extrabold text-amber-400">
              &lt;200ms
            </div>
            <div className="text-xs sm:text-sm font-medium text-slate-300">Inference Latency</div>
            <div className="text-[11px] text-slate-500">Real-time cosine scoring</div>
          </div>
          <div className="space-y-1">
            <div className="font-heading text-3xl sm:text-4xl font-extrabold text-emerald-400">
              100%
            </div>
            <div className="text-xs sm:text-sm font-medium text-slate-300">Tamper Proof</div>
            <div className="text-[11px] text-slate-500">Ethereum on-chain hashes</div>
          </div>
          <div className="space-y-1">
            <div className="font-heading text-3xl sm:text-4xl font-extrabold text-sky-400">
              6-Digit
            </div>
            <div className="text-xs sm:text-sm font-medium text-slate-300">Mandatory Verification</div>
            <div className="text-[11px] text-slate-500">Blocking auth security</div>
          </div>
        </div>
      </section>

      {/* Role-Specific Highlights */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="card-base flex flex-col justify-between border-blue-200 bg-gradient-to-br from-white to-blue-50/50">
          <div className="space-y-3">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
              For University Students
            </span>
            <h3 className="font-heading text-xl font-bold text-slate-900">
              Discover Matches Tailored to Your Actual Skills
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Upload your resume once to receive automated semantic similarity scores. Transparent heuristic risk flags protect you from suspicious listings. Once completed, claim your blockchain-verified certificate.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-blue-100">
            <Link to="/student/internships" className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition">
              Explore Available Internships →
            </Link>
          </div>
        </div>

        <div className="card-base flex flex-col justify-between border-amber-200 bg-gradient-to-br from-white to-amber-50/40">
          <div className="space-y-3">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
              For Corporate Recruiters
            </span>
            <h3 className="font-heading text-xl font-bold text-slate-900">
              Attract &amp; Credential Top Verified Talent
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Post opportunities with organizational domain badges and website matching signals. Review student applications with structured profiles, and mint cryptographically authentic certificates upon completion.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-amber-100">
            <Link to="/company/internships/new" className="text-sm font-semibold text-amber-700 hover:text-amber-900 transition">
              Create an Internship Posting →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
