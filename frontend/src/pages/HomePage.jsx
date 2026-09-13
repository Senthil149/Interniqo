import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { MotionLink } from '../components/MotionButton.jsx'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
}

export default function HomePage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="space-y-16 py-4">
      {/* Hero Section with continuous floating ambient blobs and staggered entrance */}
      <section className="relative overflow-hidden rounded-3xl border border-primary-200/60 bg-gradient-to-b from-primary-50/70 via-white to-white p-8 sm:p-14 text-center shadow-sm">
        {/* Category 7: Continuous background animation — slowly shifting gradient blobs in teal/amber palette */}
        <motion.div
          animate={{
            x: [0, 35, -25, 0],
            y: [0, -30, 20, 0],
            scale: [1, 1.15, 0.95, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: 14,
            ease: 'easeInOut',
          }}
          className="pointer-events-none absolute -top-24 left-1/4 h-80 w-96 rounded-full bg-primary-400/20 blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -30, 25, 0],
            y: [0, 25, -30, 0],
            scale: [1, 0.9, 1.12, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: 18,
            ease: 'easeInOut',
          }}
          className="pointer-events-none absolute -bottom-24 right-12 h-72 w-80 rounded-full bg-accent-400/25 blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 20, -15, 0],
            y: [0, 20, -20, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 12,
            ease: 'easeInOut',
          }}
          className="pointer-events-none absolute top-1/2 -left-16 h-64 w-64 rounded-full bg-teal-300/15 blur-2xl"
        />

        {/* Hero content with staggered fade-up entrance */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative mx-auto max-w-3xl space-y-6"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/95 px-4 py-1.5 text-xs font-semibold text-primary-800 shadow-2xs backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-accent-500 animate-ping" />
            <span>Verified Opportunities • Intelligent Matching • Digital Credentials</span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="font-heading text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-[1.15]"
          >
            Next-Gen Internship Discovery &amp;{' '}
            <span className="bg-gradient-to-r from-primary-700 via-teal-600 to-accent-600 bg-clip-text text-transparent">
              Verified Credentials
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mx-auto max-w-2xl text-base text-slate-600 sm:text-lg leading-relaxed"
          >
            Connect with premier cross-border opportunities through intelligent skill-based matching, transparent employer verification, and tamper-proof digital completion credentials.
          </motion.p>

          {/* Primary Calls to Action with tactility and idle shimmer */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-3 pt-3">
            {isAuthenticated ? (
              <MotionLink
                to="/dashboard"
                variant="primary"
                pulse={true}
                className="text-base px-6 py-3"
              >
                Go to Dashboard →
              </MotionLink>
            ) : (
              <>
                <MotionLink
                  to="/register"
                  variant="primary"
                  pulse={true}
                  className="text-base px-6 py-3"
                >
                  Get Started Free →
                </MotionLink>
                <MotionLink
                  to="/login"
                  variant="secondary"
                  className="text-base px-6 py-3"
                >
                  Sign In
                </MotionLink>
              </>
            )}
            <MotionLink
              to="/verify-credential"
              variant="accent"
              pulse={true}
              className="text-base px-6 py-3"
            >
              Verify Credential
            </MotionLink>
          </motion.div>
        </motion.div>
      </section>

      {/* How Interniqo Works */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            How Interniqo Works
          </h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            From seamless profile creation to verified completion — a trusted, transparent experience for candidates and employers.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* Step 1 */}
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="card-base card-hover relative flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-800 font-heading font-bold text-sm">
                01
              </div>
              <h3 className="font-heading font-semibold text-slate-900">Smart Resume Extraction</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upload your resume PDF to automatically extract your skills, education, and domain competencies with zero manual data entry.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-primary-700">
              Instant Profile Creation
            </div>
          </motion.div>

          {/* Step 2 */}
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="card-base card-hover relative flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-800 font-heading font-bold text-sm">
                02
              </div>
              <h3 className="font-heading font-semibold text-slate-900">Contextual Skill Matching</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Our recommendation engine analyzes your true competencies against real-world role requirements for high-accuracy match rankings.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-primary-700">
              Deep Competency Alignment
            </div>
          </motion.div>

          {/* Step 3 */}
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="card-base card-hover relative flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-100 text-accent-800 font-heading font-bold text-sm">
                03
              </div>
              <h3 className="font-heading font-semibold text-slate-900">Trust &amp; Transparency Checks</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every listing is verified for fair compensation, authentic employer domains, and transparent cross-border expectations.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-accent-700">
              Screened &amp; Verified Listings
            </div>
          </motion.div>

          {/* Step 4 */}
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="card-base card-hover relative flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-100 text-success-800 font-heading font-bold text-sm">
                04
              </div>
              <h3 className="font-heading font-semibold text-slate-900">Verified Credentials</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Earn permanently verifiable completion credentials recorded on a decentralized ledger, shareable with employers worldwide.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-success-700">
              Tamper-Proof Proof of Work
            </div>
          </motion.div>
        </div>
      </section>

      {/* Product Impact Metrics */}
      <section className="rounded-3xl bg-slate-900 text-white p-8 sm:p-12 shadow-lg">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 text-center">
          <div className="space-y-1">
            <div className="font-heading text-3xl sm:text-4xl font-extrabold text-teal-400">
              98%
            </div>
            <div className="text-xs sm:text-sm font-medium text-slate-300">Match Relevance</div>
            <div className="text-[11px] text-slate-400">Skills-first competency alignment</div>
          </div>
          <div className="space-y-1">
            <div className="font-heading text-3xl sm:text-4xl font-extrabold text-accent-400">
              &lt;24h
            </div>
            <div className="text-xs sm:text-sm font-medium text-slate-300">Application Delivery</div>
            <div className="text-[11px] text-slate-400">Direct delivery to recruiting teams</div>
          </div>
          <div className="space-y-1">
            <div className="font-heading text-3xl sm:text-4xl font-extrabold text-success-400">
              100%
            </div>
            <div className="text-xs sm:text-sm font-medium text-slate-300">Verified Credentials</div>
            <div className="text-[11px] text-slate-400">Permanently verifiable proof of work</div>
          </div>
          <div className="space-y-1">
            <div className="font-heading text-3xl sm:text-4xl font-extrabold text-teal-300">
              Zero
            </div>
            <div className="text-xs sm:text-sm font-medium text-slate-300">Platform Fees</div>
            <div className="text-[11px] text-slate-400">Free for all university talent</div>
          </div>
        </div>
      </section>

      {/* Role-Specific Highlights */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="card-base flex flex-col justify-between border-primary-200/70 bg-gradient-to-br from-white to-primary-50/40">
          <div className="space-y-3">
            <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-bold text-primary-800">
              For University Students
            </span>
            <h3 className="font-heading text-xl font-bold text-slate-900">
              Discover Matches Tailored to Your Actual Skills
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Upload your resume once to receive personalized opportunity matches. Transparent trust badges protect you from suspicious listings. Once completed, claim your verified completion certificate.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-primary-100">
            <Link to="/student/internships" className="text-sm font-semibold text-primary-700 hover:text-primary-800 transition">
              Explore Available Internships →
            </Link>
          </div>
        </div>

        <div className="card-base flex flex-col justify-between border-accent-200 bg-gradient-to-br from-white to-accent-50/40">
          <div className="space-y-3">
            <span className="rounded-full bg-accent-100 px-3 py-1 text-xs font-bold text-accent-800">
              For Corporate Recruiters
            </span>
            <h3 className="font-heading text-xl font-bold text-slate-900">
              Attract &amp; Credential Top Verified Talent
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Post opportunities with verified organization badges and transparent requirements. Review qualified applicants with structured profiles, and award digitally signed certificates upon completion.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-accent-100">
            <Link to="/company/internships/new" className="text-sm font-semibold text-accent-700 hover:text-accent-900 transition">
              Create an Internship Posting →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

