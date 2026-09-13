import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../auth/AuthContext.jsx'
import { MotionLink } from '../components/MotionButton.jsx'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
}

export default function DashboardPage() {
  const { user } = useAuth()

  const role = user?.role || 'STUDENT'

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Welcome Banner */}
      <motion.section
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl border border-primary-200/60 bg-gradient-to-r from-primary-50/50 via-warm-bg to-white p-6 sm:p-8 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary-700/10 px-2.5 py-0.5 text-xs font-bold text-primary-800">
                {role} PORTAL
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span className="text-xs text-slate-500 font-mono">{user?.email}</span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Welcome back, {user?.name || 'User'}!
            </h1>
            <p className="text-sm text-slate-600 max-w-xl">
              {role === 'STUDENT' &&
                'Explore your personalized recommendations, track active applications, and manage your verified credentials.'}
              {role === 'COMPANY' &&
                'Manage your company postings, review candidate applicants, and issue verified completion credentials.'}
              {role === 'ADMIN' &&
                'Platform administration: review system metrics, manage user roles, audit flagged listings, and monitor verification records.'}
            </p>
          </div>

          <div className="flex-shrink-0">
            {role === 'STUDENT' && (
              <MotionLink to="/student/recommendations" className="btn-primary" pulse={true}>
                View Recommendations →
              </MotionLink>
            )}
            {role === 'COMPANY' && (
              <MotionLink to="/company/internships/new" className="btn-primary" pulse={true}>
                + Post Internship
              </MotionLink>
            )}
            {role === 'ADMIN' && (
              <MotionLink to="/admin" className="btn-primary">
                Open Admin Console →
              </MotionLink>
            )}
          </div>
        </div>
      </motion.section>

      {/* STUDENT DASHBOARD */}
      {role === 'STUDENT' && (
        <>
          {/* Quick Stat Highlights */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card-base card-hover">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Skill Matching</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold">
                  ⚡
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">Active Fit</div>
              <div className="mt-1 text-xs text-slate-500">Ranked by contextual skill alignment</div>
            </div>

            <div className="card-base card-hover">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">My Applications</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 font-bold">
                  📄
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">Tracked</div>
              <div className="mt-1 text-xs text-slate-500">Multi-step hiring timeline</div>
            </div>

            <div className="card-base card-hover">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Risk Audit</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 font-bold">
                  🛡️
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">Multi-Signal</div>
              <div className="mt-1 text-xs text-slate-500">Automated stipend &amp; domain checks</div>
            </div>

            <div className="card-base card-hover">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Verified Credentials</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 font-bold">
                  🛡️
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">Digital Proof</div>
              <div className="mt-1 text-xs text-slate-500">Publicly verifiable completion records</div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="space-y-4">
            <h2 className="font-heading text-lg font-bold text-slate-900">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                to="/student/recommendations"
                className="card-base card-hover flex flex-col justify-between border-blue-100 bg-white"
              >
                <div className="space-y-2">
                  <div className="text-2xl">🎯</div>
                  <h3 className="font-heading font-semibold text-slate-900">Recommended Matches</h3>
                  <p className="text-xs text-slate-600">
                    View internships ranked specifically against your profile and resume skills.
                  </p>
                </div>
                <div className="mt-4 text-xs font-semibold text-blue-600">Explore matches →</div>
              </Link>

              <Link
                to="/student/internships"
                className="card-base card-hover flex flex-col justify-between bg-white"
              >
                <div className="space-y-2">
                  <div className="text-2xl">🔍</div>
                  <h3 className="font-heading font-semibold text-slate-900">Browse Internships</h3>
                  <p className="text-xs text-slate-600">
                    Search and filter opportunities across countries, work modes, and stipends.
                  </p>
                </div>
                <div className="mt-4 text-xs font-semibold text-blue-600">Search directory →</div>
              </Link>

              <Link
                to="/student/resume"
                className="card-base card-hover flex flex-col justify-between bg-white"
              >
                <div className="space-y-2">
                  <div className="text-2xl">📤</div>
                  <h3 className="font-heading font-semibold text-slate-900">My Resume</h3>
                  <p className="text-xs text-slate-600">
                    Upload or update your PDF resume to refresh automated skill extraction.
                  </p>
                </div>
                <div className="mt-4 text-xs font-semibold text-blue-600">Manage resume →</div>
              </Link>

              <Link
                to="/student/applications"
                className="card-base card-hover flex flex-col justify-between bg-white"
              >
                <div className="space-y-2">
                  <div className="text-2xl">📋</div>
                  <h3 className="font-heading font-semibold text-slate-900">My Applications</h3>
                  <p className="text-xs text-slate-600">
                    View your active submissions, hiring progress, and awarded certificates.
                  </p>
                </div>
                <div className="mt-4 text-xs font-semibold text-blue-600">Check status →</div>
              </Link>
            </div>
          </div>
        </>
      )}

      {/* COMPANY DASHBOARD */}
      {role === 'COMPANY' && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card-base card-hover">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Postings</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold">
                  💼
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">Active Listings</div>
              <div className="mt-1 text-xs text-slate-500">Open for student applications</div>
            </div>

            <div className="card-base card-hover">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Candidate Flow</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 font-bold">
                  👥
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">Review Pipeline</div>
              <div className="mt-1 text-xs text-slate-500">Track candidates from applied to hired</div>
            </div>

            <div className="card-base card-hover">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Trust Signals</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 font-bold">
                  🌐
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">Domain Quality</div>
              <div className="mt-1 text-xs text-slate-500">Verified official business domain</div>
            </div>

            <div className="card-base card-hover">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Credentials</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 font-bold">
                  📜
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">Instant Issuance</div>
              <div className="mt-1 text-xs text-slate-500">Award tamper-proof completion certificates</div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-heading text-lg font-bold text-slate-900">Recruiter Actions</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                to="/company/internships/new"
                className="card-base card-hover flex flex-col justify-between border-blue-100 bg-white"
              >
                <div className="space-y-2">
                  <div className="text-2xl">➕</div>
                  <h3 className="font-heading font-semibold text-slate-900">Post New Internship</h3>
                  <p className="text-xs text-slate-600">
                    Publish an opportunity with stipend, duration, and required skills.
                  </p>
                </div>
                <div className="mt-4 text-xs font-semibold text-blue-600">Create listing →</div>
              </Link>

              <Link
                to="/company/applications"
                className="card-base card-hover flex flex-col justify-between bg-white"
              >
                <div className="space-y-2">
                  <div className="text-2xl">📥</div>
                  <h3 className="font-heading font-semibold text-slate-900">Candidate Applications</h3>
                  <p className="text-xs text-slate-600">
                    Evaluate applicants, update statuses, and issue completion certificates.
                  </p>
                </div>
                <div className="mt-4 text-xs font-semibold text-blue-600">Review applicants →</div>
              </Link>

              <Link
                to="/company/internships"
                className="card-base card-hover flex flex-col justify-between bg-white"
              >
                <div className="space-y-2">
                  <div className="text-2xl">📋</div>
                  <h3 className="font-heading font-semibold text-slate-900">Manage Listings</h3>
                  <p className="text-xs text-slate-600">
                    View active postings, edit details, and run automated risk re-assessments.
                  </p>
                </div>
                <div className="mt-4 text-xs font-semibold text-blue-600">View listings →</div>
              </Link>

              <Link
                to="/company/profile"
                className="card-base card-hover flex flex-col justify-between bg-white"
              >
                <div className="space-y-2">
                  <div className="text-2xl">🏢</div>
                  <h3 className="font-heading font-semibold text-slate-900">Company Profile</h3>
                  <p className="text-xs text-slate-600">
                    Update company website, description, and preview live domain match badges.
                  </p>
                </div>
                <div className="mt-4 text-xs font-semibold text-blue-600">Edit profile →</div>
              </Link>
            </div>
          </div>
        </>
      )}

      {/* ADMIN DASHBOARD SHORTCUT */}
      {role === 'ADMIN' && (
        <div className="card-base space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-slate-900">
              System Administration Central
            </h2>
            <Link to="/admin" className="btn-primary text-xs">
              Go to Full Admin Console →
            </Link>
          </div>
          <p className="text-sm text-slate-600">
            Access full platform management: User accounts, Company domain verification, Internship moderation, Quality and risk screening, and Credential audit trails.
          </p>
        </div>
      )}
    </motion.div>
  )
}
