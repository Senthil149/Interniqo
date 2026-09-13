import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../auth/AuthContext.jsx'
import { MotionLink } from '../components/MotionButton.jsx'
import { getRecommendationDashboard, getRecommendations } from '../api/recommendations.js'

function getFitLevel(score) {
  if (score == null) return 'Fair Match'
  if (score >= 0.70) return 'Best Match'
  if (score >= 0.50) return 'Strong Match'
  if (score >= 0.30) return 'Good Match'
  return 'Fair Match'
}

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
  const [dashboardData, setDashboardData] = useState(null)
  const [loadingMetrics, setLoadingMetrics] = useState(false)

  useEffect(() => {
    if (role === 'STUDENT') {
      setLoadingMetrics(true)
      getRecommendationDashboard()
        .then(({ data }) => {
          setDashboardData(data)
        })
        .catch(async (err) => {
          console.warn('Dashboard endpoint fallback via getRecommendations:', err)
          try {
            const { data } = await getRecommendations()
            const rawRecs = data.recommendations || []
            const recs = rawRecs.filter((item, index, self) =>
              index === self.findIndex((t) => (t.internshipId != null && t.internshipId === item.internshipId) ||
                (t.companyName === item.companyName && t.title === item.title))
            )
            const topScore = recs.length > 0 ? recs[0].similarityScore : null
            setDashboardData({
              hasProfile: data.hasProfile ?? true,
              totalRecommended: recs.length,
              totalSaved: 0,
              totalApplied: 0,
              totalShortlisted: 0,
              totalAccepted: 0,
              topMatchScore: topScore,
              topMatchFitLevel: getFitLevel(topScore),
              bestMatchCount: recs.filter((r) => (r.similarityScore ?? 0) >= 0.70).length,
              strongMatchCount: recs.filter((r) => (r.similarityScore ?? 0) >= 0.50 && (r.similarityScore ?? 0) < 0.70).length,
              goodMatchCount: recs.filter((r) => (r.similarityScore ?? 0) >= 0.30 && (r.similarityScore ?? 0) < 0.50).length,
              topRecommendations: recs.slice(0, 3),
              lastComputedAt: data.generatedAt,
              summaryMessage: data.message,
            })
          } catch {
            setDashboardData(null)
          }
        })
        .finally(() => setLoadingMetrics(false))
    }
  }, [role])

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
          {/* Real Database Recommendation Dashboard Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card-base card-hover">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">AI Recommendations</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600 font-bold">
                  ⚡
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold font-heading text-slate-900">
                {loadingMetrics ? '…' : `${dashboardData?.totalRecommended ?? 0} Roles`}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {dashboardData?.topMatchScore != null
                  ? `Top: ${dashboardData.topMatchScore.toFixed(3)} (${dashboardData.topMatchFitLevel || getFitLevel(dashboardData.topMatchScore)})`
                  : 'SBERT semantic skill fit'}
              </div>
            </div>

            <div className="card-base card-hover">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">My Applications</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 font-bold">
                  📄
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold font-heading text-slate-900">
                {loadingMetrics ? '…' : `${dashboardData?.totalApplied ?? 0} Submitted`}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {dashboardData
                  ? `${dashboardData.totalShortlisted} Shortlisted • ${dashboardData.totalAccepted} Accepted`
                  : 'Track multi-step hiring timeline'}
              </div>
            </div>

            <div className="card-base card-hover">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Saved Internships</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 font-bold">
                  🔖
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold font-heading text-slate-900">
                {loadingMetrics ? '…' : `${dashboardData?.totalSaved ?? 0} Saved`}
              </div>
              <div className="mt-1 text-xs text-slate-500">Bookmarked opportunities</div>
            </div>

            <div className="card-base card-hover">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Verified Credentials</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 font-bold">
                  🛡️
                </span>
              </div>
              <div className="mt-2 text-2xl font-bold font-heading text-slate-900">
                {loadingMetrics
                  ? '…'
                  : (dashboardData?.totalAccepted ?? 0) > 0
                  ? `${dashboardData.totalAccepted} Eligible`
                  : '0 Issued'}
              </div>
              <div className="mt-1 text-xs text-slate-500">Public blockchain records</div>
            </div>
          </div>

          {/* Top AI Recommended Roles (if available) */}
          {dashboardData?.topRecommendations?.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="font-heading text-lg font-bold text-slate-900">Top AI Matches</h2>
                  <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-bold text-primary-800">
                    SBERT Ranked
                  </span>
                </div>
                <Link
                  to="/student/recommendations"
                  className="text-xs font-semibold text-primary-700 hover:text-primary-800 transition-colors"
                >
                  View All ({dashboardData.totalRecommended}) →
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {dashboardData.topRecommendations
                  .filter((item, index, self) =>
                    index === self.findIndex((t) => (t.internshipId != null && t.internshipId === item.internshipId) ||
                      (t.companyName === item.companyName && t.title === item.title))
                  )
                  .slice(0, 3)
                  .map((item, idx) => {
                    const fit = item.fitLevel || getFitLevel(item.similarityScore)
                    return (
                      <div
                        key={item.id || item.internshipId || idx}
                        className="card-base card-hover p-4 bg-white flex flex-col justify-between space-y-3 border-primary-100/70"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-800 border border-primary-200">
                              #{item.ranking || (idx + 1)} • {fit}
                            </span>
                            <span className="font-mono text-xs font-bold text-emerald-700">
                              {item.similarityScore != null ? item.similarityScore.toFixed(3) : ''}
                            </span>
                          </div>
                          <Link
                            to={`/internships/${item.internshipId}`}
                            className="mt-2 block font-heading font-bold text-slate-900 hover:text-primary-700 text-sm transition-colors"
                          >
                            {item.title}
                          </Link>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {item.companyName} • 📍 {item.country}
                          </div>

                          {item.matchedSkills && item.matchedSkills.length > 0 && (
                            <div className="mt-2.5 flex flex-wrap gap-1">
                              {item.matchedSkills.slice(0, 3).map((sk, skIdx) => (
                                <span
                                  key={skIdx}
                                  className="rounded bg-emerald-50 text-[10px] font-semibold text-emerald-700 px-1.5 py-0.5 border border-emerald-200/60"
                                >
                                  ✓ {sk}
                                </span>
                              ))}
                            </div>
                          )}

                          {item.matchingStrengths && item.matchingStrengths.length > 0 && (
                            <div className="mt-2 text-[11px] text-slate-600 flex items-start gap-1">
                              <span className="text-emerald-600 font-bold">✓</span>
                              <span className="line-clamp-1">{item.matchingStrengths[0]}</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">
                            {item.stipend != null
                              ? `${item.stipend} ${item.currency || ''}/mo`
                              : item.workMode}
                          </span>
                          <Link
                            to={`/internships/${item.internshipId}`}
                            className="font-semibold text-primary-700 hover:text-primary-800 transition-colors"
                          >
                            View Details →
                          </Link>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

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
