import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getAdminMetrics,
  getAdminUsers,
  updateAdminUserRole,
  getAdminCompanies,
  toggleCompanyVerification,
  getAdminInternships,
  updateAdminInternshipStatus,
  getAdminFlaggedPostings,
  reanalyzeInternshipRisk,
  getAdminEmailVerifications,
  getAdminBlockchainRecords,
} from '../../api/admin.js'
import RiskBadge from '../../components/RiskBadge.jsx'
import CompanyVerificationBadge from '../../components/CompanyVerificationBadge.jsx'
import SkeletonLoader from '../../components/SkeletonLoader.jsx'
import { MotionButton } from '../../components/MotionButton.jsx'

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [metrics, setMetrics] = useState(null)
  const [loadingMetrics, setLoadingMetrics] = useState(true)

  // Users state
  const [users, setUsers] = useState([])
  const [userRoleFilter, setUserRoleFilter] = useState('ALL')
  const [userSearch, setUserSearch] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [updatingUserId, setUpdatingUserId] = useState(null)

  // Companies state
  const [companies, setCompanies] = useState([])
  const [companySearch, setCompanySearch] = useState('')
  const [companyDomainFilter, setCompanyDomainFilter] = useState('ALL') // 'ALL' | 'ORG' | 'PERSONAL' | 'UNVERIFIED'
  const [companyWebsiteFilter, setCompanyWebsiteFilter] = useState('ALL') // 'ALL' | 'MATCHED' | 'NO_MATCH'
  const [companySort, setCompanySort] = useState('newest') // 'newest' | 'name' | 'postings' | 'domain'
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [togglingCompanyId, setTogglingCompanyId] = useState(null)

  // Internships state
  const [internships, setInternships] = useState([])
  const [internshipStatusFilter, setInternshipStatusFilter] = useState('ALL')
  const [internshipSearch, setInternshipSearch] = useState('')
  const [loadingInternships, setLoadingInternships] = useState(false)
  const [updatingInternshipId, setUpdatingInternshipId] = useState(null)

  // Flagged Postings state
  const [flagged, setFlagged] = useState([])
  const [loadingFlagged, setLoadingFlagged] = useState(false)
  const [reanalyzingId, setReanalyzingId] = useState(null)

  // Verifications state
  const [verificationSubTab, setVerificationSubTab] = useState('email')
  const [emailVerifications, setEmailVerifications] = useState([])
  const [blockchainRecords, setBlockchainRecords] = useState([])
  const [loadingVerifications, setLoadingVerifications] = useState(false)

  const [feedbackMsg, setFeedbackMsg] = useState(null)

  useEffect(() => {
    loadMetrics()
  }, [])

  useEffect(() => {
    if (activeTab === 'users') loadUsers()
    if (activeTab === 'companies') loadCompanies()
    if (activeTab === 'internships') loadInternships()
    if (activeTab === 'risk') loadFlagged()
    if (activeTab === 'verifications') loadVerifications()
  }, [activeTab, userRoleFilter, internshipStatusFilter])

  function showFeedback(msg, isError = false) {
    setFeedbackMsg({ text: msg, isError })
    setTimeout(() => setFeedbackMsg(null), 4000)
  }

  async function loadMetrics() {
    setLoadingMetrics(true)
    try {
      const res = await getAdminMetrics()
      setMetrics(res.data)
    } catch {
      showFeedback('Unable to load admin metrics', true)
    } finally {
      setLoadingMetrics(false)
    }
  }

  async function loadUsers() {
    setLoadingUsers(true)
    try {
      const res = await getAdminUsers(userRoleFilter)
      setUsers(res.data || [])
    } catch {
      showFeedback('Failed to load users', true)
    } finally {
      setLoadingUsers(false)
    }
  }

  async function handleRoleChange(userId, newRole) {
    setUpdatingUserId(userId)
    try {
      const res = await updateAdminUserRole(userId, newRole)
      setUsers((prev) => prev.map((u) => (u.id === userId ? res.data : u)))
      showFeedback(`User role updated to ${newRole}`)
      loadMetrics()
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Failed to update user role', true)
    } finally {
      setUpdatingUserId(null)
    }
  }

  async function loadCompanies() {
    setLoadingCompanies(true)
    try {
      const res = await getAdminCompanies()
      setCompanies(res.data || [])
    } catch {
      showFeedback('Failed to load companies', true)
    } finally {
      setLoadingCompanies(false)
    }
  }

  async function handleToggleVerification(companyId, currentVerified) {
    setTogglingCompanyId(companyId)
    const targetStatus = !currentVerified
    try {
      const res = await toggleCompanyVerification(companyId, targetStatus)
      setCompanies((prev) => prev.map((c) => (c.id === companyId ? res.data : c)))
      showFeedback(`Company verification ${targetStatus ? 'granted' : 'revoked'}`)
      loadMetrics()
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Failed to toggle verification', true)
    } finally {
      setTogglingCompanyId(null)
    }
  }

  async function loadInternships() {
    setLoadingInternships(true)
    try {
      const res = await getAdminInternships(internshipStatusFilter)
      setInternships(res.data || [])
    } catch {
      showFeedback('Failed to load internships', true)
    } finally {
      setLoadingInternships(false)
    }
  }

  async function handleStatusChange(internshipId, newStatus) {
    setUpdatingInternshipId(internshipId)
    try {
      const res = await updateAdminInternshipStatus(internshipId, newStatus)
      setInternships((prev) => prev.map((i) => (i.internshipId === internshipId ? res.data : i)))
      if (activeTab === 'risk') {
        setFlagged((prev) => prev.map((i) => (i.internshipId === internshipId ? res.data : i)))
      }
      showFeedback(`Internship status updated to ${newStatus}`)
      loadMetrics()
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Failed to update internship status', true)
    } finally {
      setUpdatingInternshipId(null)
    }
  }

  async function loadFlagged() {
    setLoadingFlagged(true)
    try {
      const res = await getAdminFlaggedPostings()
      setFlagged(res.data || [])
    } catch {
      showFeedback('Failed to load flagged postings', true)
    } finally {
      setLoadingFlagged(false)
    }
  }

  async function handleReanalyzeRisk(internshipId) {
    setReanalyzingId(internshipId)
    try {
      const res = await reanalyzeInternshipRisk(internshipId)
      showFeedback(`Risk re-analyzed: Score ${res.data.score} (${res.data.level})`)
      loadFlagged()
      loadMetrics()
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Risk re-analysis failed', true)
    } finally {
      setReanalyzingId(null)
    }
  }

  async function loadVerifications() {
    setLoadingVerifications(true)
    try {
      const [emailRes, bcRes] = await Promise.all([
        getAdminEmailVerifications(),
        getAdminBlockchainRecords(),
      ])
      setEmailVerifications(emailRes.data || [])
      setBlockchainRecords(bcRes.data || [])
    } catch {
      showFeedback('Failed to load verification logs', true)
    } finally {
      setLoadingVerifications(false)
    }
  }

  // Filtered lists
  const filteredUsers = users.filter((u) => {
    if (!userSearch) return true
    const q = userSearch.toLowerCase()
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
  })

  const filteredCompanies = companies
    .filter((c) => {
      if (companyDomainFilter === 'ORG') {
        if (!c.emailVerified || c.personalEmail) return false
      } else if (companyDomainFilter === 'PERSONAL') {
        if (!c.personalEmail) return false
      } else if (companyDomainFilter === 'UNVERIFIED') {
        if (c.emailVerified) return false
      }

      if (companyWebsiteFilter === 'MATCHED') {
        if (!c.websiteDomainMatch) return false
      } else if (companyWebsiteFilter === 'NO_MATCH') {
        if (c.websiteDomainMatch) return false
      }

      if (!companySearch) return true
      const q = companySearch.toLowerCase()
      return (
        c.companyName?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.emailDomain?.toLowerCase().includes(q) ||
        c.country?.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      if (companySort === 'name') {
        return (a.companyName || '').localeCompare(b.companyName || '')
      }
      if (companySort === 'postings') {
        return (b.internshipCount || 0) - (a.internshipCount || 0)
      }
      if (companySort === 'domain') {
        return (a.emailDomain || '').localeCompare(b.emailDomain || '')
      }
      return (b.id || 0) - (a.id || 0) // default newest
    })

  const filteredInternships = internships.filter((i) => {
    if (!internshipSearch) return true
    const q = internshipSearch.toLowerCase()
    return i.title?.toLowerCase().includes(q) || i.companyName?.toLowerCase().includes(q)
  })

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Admin Console
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Platform governance, user & company oversight, flagged postings review, and verification audit trails.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            loadMetrics()
            if (activeTab === 'users') loadUsers()
            if (activeTab === 'companies') loadCompanies()
            if (activeTab === 'internships') loadInternships()
            if (activeTab === 'risk') loadFlagged()
            if (activeTab === 'verifications') loadVerifications()
            showFeedback('Refreshed data')
          }}
          className="inline-flex items-center gap-1.5 self-start rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh All
        </button>
      </div>

      {/* Feedback Alert Toast */}
      {feedbackMsg && (
        <div
          className={`rounded-xl border px-4 py-2.5 text-sm transition-all shadow-xs ${
            feedbackMsg.isError
              ? 'border-rose-200 bg-rose-50 text-rose-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          {feedbackMsg.text}
        </div>
      )}

      {/* High-level Metrics Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Users</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {loadingMetrics ? '...' : metrics?.totalUsers ?? 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {metrics ? `${metrics.totalStudents} st / ${metrics.totalCompanies} co` : ''}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Companies</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">
            {loadingMetrics ? '...' : metrics?.totalCompanies ?? 0}
          </p>
          <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">
            {metrics ? `${metrics.verifiedCompanies} verified domain` : ''}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Internships</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {loadingMetrics ? '...' : metrics?.totalInternships ?? 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {metrics ? `${metrics.activeInternships} active postings` : ''}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Applications</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {loadingMetrics ? '...' : metrics?.totalApplications ?? 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Submissions</p>
        </div>

        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 shadow-xs">
          <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Flagged Postings</p>
          <p className="mt-1 text-2xl font-bold text-rose-700">
            {loadingMetrics ? '...' : (metrics?.highRiskPostings || 0) + (metrics?.mediumRiskPostings || 0)}
          </p>
          <p className="text-[11px] text-rose-600 mt-0.5 font-medium">
            {metrics ? `${metrics.highRiskPostings} high / ${metrics.mediumRiskPostings} medium` : ''}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
          <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">On-Chain Credentials</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {loadingMetrics ? '...' : metrics?.totalBlockchainCredentials ?? 0}
          </p>
          <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">Verified blocks</p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto text-sm font-medium">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'users', label: 'Users' },
            { id: 'companies', label: 'Companies' },
            { id: 'internships', label: 'Internships' },
            {
              id: 'risk',
              label: 'Risk Review',
              badge: (metrics?.highRiskPostings || 0) + (metrics?.mediumRiskPostings || 0),
            },
            { id: 'verifications', label: 'Verifications' },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 transition whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'border-primary-700 text-primary-700 font-semibold'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              {tab.label}
              {tab.badge != null && tab.badge > 0 && (
                <span className="rounded-full bg-danger-100 px-2 py-0.5 text-xs font-bold text-danger-700">
                  {tab.badge}
                </span>
              )}
            </motion.button>
          ))}
        </nav>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Action Alert Banner for Pending Risks */}
          {metrics && (metrics.highRiskPostings > 0 || metrics.mediumRiskPostings > 0) && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-amber-900">
                  ⚠️ Action Recommended: {metrics.highRiskPostings + metrics.mediumRiskPostings} Postings Flagged by Risk Engine
                </h3>
                <p className="mt-1 text-sm text-amber-800">
                  {metrics.highRiskPostings} high-risk and {metrics.mediumRiskPostings} medium-risk postings have triggered automated indicators (fee requests, unrealistic stipends, etc.). Review and take action.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('risk')}
                className="inline-flex items-center justify-center rounded-xl bg-amber-700 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-800 transition whitespace-nowrap shadow-xs"
              >
                Go to Risk Review →
              </button>
            </div>
          )}

          {/* Detailed Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* User Breakdown */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
              <h3 className="font-bold text-slate-900 text-base">User Community</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Student Accounts:</span>
                  <span className="font-semibold text-slate-800">{metrics?.totalStudents ?? 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Company Accounts:</span>
                  <span className="font-semibold text-slate-800">{metrics?.totalCompanies ?? 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Administrator Accounts:</span>
                  <span className="font-semibold text-blue-600">{metrics?.totalAdmins ?? 0}</span>
                </div>
                <div className="flex justify-between py-1 pt-2 font-bold text-slate-900">
                  <span>Total Registered:</span>
                  <span>{metrics?.totalUsers ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Postings Breakdown */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
              <h3 className="font-bold text-slate-900 text-base">Internship Listings</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Active Opportunities:</span>
                  <span className="font-semibold text-emerald-700">{metrics?.activeInternships ?? 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Closed / Completed:</span>
                  <span className="font-semibold text-slate-600">{metrics?.closedInternships ?? 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Applications Submitted:</span>
                  <span className="font-semibold text-slate-800">{metrics?.totalApplications ?? 0}</span>
                </div>
                <div className="flex justify-between py-1 pt-2 font-bold text-slate-900">
                  <span>Total Postings:</span>
                  <span>{metrics?.totalInternships ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Compliance & Verification */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
              <h3 className="font-bold text-slate-900 text-base">Trust & Verification</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Verified Company Domains:</span>
                  <span className="font-semibold text-emerald-700">{metrics?.verifiedCompanies ?? 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Email Verification Tokens:</span>
                  <span className="font-semibold text-slate-800">{metrics?.totalEmailVerifications ?? 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Issued Credentials:</span>
                  <span className="font-semibold text-blue-600">{metrics?.totalBlockchainCredentials ?? 0}</span>
                </div>
                <div className="flex justify-between py-1 pt-2 font-bold text-slate-900">
                  <span>High/Med Risk Flags:</span>
                  <span className="text-rose-600">
                    {(metrics?.highRiskPostings || 0) + (metrics?.mediumRiskPostings || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex gap-2">
              {['ALL', 'STUDENT', 'COMPANY', 'ADMIN'].map((r) => (
                <button
                  key={r}
                  onClick={() => setUserRoleFilter(r)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    userRoleFilter === r
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Search users by name or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full sm:w-64 rounded-xl border border-slate-300 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>

          {loadingUsers ? (
            <SkeletonLoader variant="table-block" count={5} />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Profile Info</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Change Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 font-mono text-slate-400">#{u.id}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{u.name}</p>
                        <p className="text-slate-500">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-700'
                              : u.role === 'COMPANY'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {u.role === 'COMPANY' && (
                          <span>
                            {u.companyName} {u.emailVerified ? '✓' : '(unverified)'}
                          </span>
                        )}
                        {u.role === 'STUDENT' && <span>Student profile #{u.studentId || u.id}</span>}
                        {u.role === 'ADMIN' && <span className="text-slate-400">Platform Admin</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        {['STUDENT', 'COMPANY', 'ADMIN'].map((targetRole) => (
                          <button
                            key={targetRole}
                            disabled={updatingUserId === u.id || u.role === targetRole}
                            onClick={() => handleRoleChange(u.id, targetRole)}
                            className={`rounded px-2 py-0.5 text-[10px] font-medium transition ${
                              u.role === targetRole
                                ? 'bg-slate-100 text-slate-400 cursor-default'
                                : 'border border-slate-300 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {targetRole}
                          </button>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COMPANIES */}
      {activeTab === 'companies' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">
                Manage registered company accounts, monitor domain signals, and override verification status.
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Note: Personal email signals are informational indicators, not conclusive proof of illegitimacy.
              </p>
            </div>
            <input
              type="text"
              placeholder="Search by name, email, domain..."
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              className="w-full sm:w-72 rounded-xl border border-slate-300 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Filters & Sorting Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-600">Domain Type:</span>
              <select
                value={companyDomainFilter}
                onChange={(e) => setCompanyDomainFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="ALL">All Domains ({companies.length})</option>
                <option value="ORG">Verified Org Domains</option>
                <option value="PERSONAL">Personal Email Providers (Review Recommended)</option>
                <option value="UNVERIFIED">Unverified Accounts</option>
              </select>

              <span className="font-semibold text-slate-600 ml-2">Website Match:</span>
              <select
                value={companyWebsiteFilter}
                onChange={(e) => setCompanyWebsiteFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="ALL">All Website States</option>
                <option value="MATCHED">🌐 Matches Website Domain</option>
                <option value="NO_MATCH">No Match / Not Stated</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600">Sort By:</span>
              <select
                value={companySort}
                onChange={(e) => setCompanySort(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="name">Company Name (A-Z)</option>
                <option value="postings">Most Postings</option>
                <option value="domain">Email Domain (A-Z)</option>
              </select>
            </div>
          </div>

          {loadingCompanies ? (
            <SkeletonLoader variant="table-block" count={5} />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">Location & Web</th>
                    <th className="px-4 py-3">Postings</th>
                    <th className="px-4 py-3">Email & Domain Signals</th>
                    <th className="px-4 py-3 text-right">Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCompanies.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        No companies match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredCompanies.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3 font-mono text-slate-400">#{c.id}</td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{c.companyName}</p>
                          <p className="text-slate-500">{c.email}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <p>{c.country || 'N/A'}</p>
                          {c.website && (
                            <a
                              href={c.website.startsWith('http') ? c.website : `https://${c.website}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline text-[11px]"
                            >
                              {c.website}
                            </a>
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-700">
                          {c.internshipCount} postings
                        </td>
                        <td className="px-4 py-3">
                          <CompanyVerificationBadge
                            verified={c.emailVerified}
                            personalEmail={c.personalEmail}
                            websiteDomainMatch={c.websiteDomainMatch}
                            website={c.website}
                            emailDomain={c.emailDomain}
                            size="sm"
                          />
                        </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={togglingCompanyId === c.id}
                          onClick={() => handleToggleVerification(c.id, c.emailVerified)}
                          className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                            c.emailVerified
                              ? 'border border-rose-300 text-rose-700 hover:bg-rose-50'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {togglingCompanyId === c.id
                            ? 'Updating...'
                            : c.emailVerified
                            ? 'Revoke Verification'
                            : 'Verify Domain'}
                        </button>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: INTERNSHIPS */}
      {activeTab === 'internships' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex gap-2">
              {['ALL', 'ACTIVE', 'CLOSED', 'SUSPENDED'].map((s) => (
                <button
                  key={s}
                  onClick={() => setInternshipStatusFilter(s)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    internshipStatusFilter === s
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Search internships..."
              value={internshipSearch}
              onChange={(e) => setInternshipSearch(e.target.value)}
              className="w-full sm:w-64 rounded-xl border border-slate-300 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>

          {loadingInternships ? (
            <SkeletonLoader variant="table-block" count={5} />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Position & Company</th>
                    <th className="px-4 py-3">Location & Mode</th>
                    <th className="px-4 py-3">Stipend</th>
                    <th className="px-4 py-3">Risk Assessment</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInternships.map((i) => (
                    <tr key={i.internshipId} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 font-mono text-slate-400">#{i.internshipId}</td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/internships/${i.internshipId}`}
                          className="font-bold text-slate-900 hover:text-blue-600 transition"
                        >
                          {i.title}
                        </Link>
                        <p className="text-slate-500">{i.companyName}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <p>{i.country}{i.city ? `, ${i.city}` : ''}</p>
                        <p className="text-[11px] text-slate-400">{i.workMode}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {i.stipend != null ? `${i.stipend} ${i.currency}` : 'Unpaid'}
                      </td>
                      <td className="px-4 py-3">
                        <RiskBadge score={i.riskScore} level={i.riskLevel} reasons={i.riskReasons} />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            i.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : i.status === 'CLOSED'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {i.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        {i.status !== 'ACTIVE' && (
                          <button
                            type="button"
                            disabled={updatingInternshipId === i.internshipId}
                            onClick={() => handleStatusChange(i.internshipId, 'ACTIVE')}
                            className="rounded px-2 py-1 text-[11px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition"
                          >
                            Activate
                          </button>
                        )}
                        {i.status !== 'CLOSED' && (
                          <button
                            type="button"
                            disabled={updatingInternshipId === i.internshipId}
                            onClick={() => handleStatusChange(i.internshipId, 'CLOSED')}
                            className="rounded px-2 py-1 text-[11px] font-semibold border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
                          >
                            Close
                          </button>
                        )}
                        {i.status !== 'SUSPENDED' && (
                          <button
                            type="button"
                            disabled={updatingInternshipId === i.internshipId}
                            onClick={() => handleStatusChange(i.internshipId, 'SUSPENDED')}
                            className="rounded px-2 py-1 text-[11px] font-semibold border border-rose-300 text-rose-700 hover:bg-rose-50 transition"
                          >
                            Suspend
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: RISK REVIEW */}
      {activeTab === 'risk' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-bold text-slate-900">Flagged Postings Review Inbox</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review internships where the automated risk scoring engine detected warning indicators. You can trigger re-analysis or take down suspicious postings.
            </p>
          </div>

          {loadingFlagged ? (
            <SkeletonLoader variant="card" count={3} />
          ) : flagged.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
              <span className="text-2xl">🎉</span>
              <h3 className="mt-2 text-base font-bold text-slate-900">All Clear</h3>
              <p className="text-xs text-slate-500 mt-1">
                No postings currently flag as High or Medium risk.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {flagged.map((item) => (
                <div
                  key={item.internshipId}
                  className={`rounded-2xl border p-5 bg-white shadow-xs space-y-4 ${
                    item.riskLevel === 'HIGH' ? 'border-rose-300' : 'border-amber-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-400">#{item.internshipId}</span>
                        <Link
                          to={`/internships/${item.internshipId}`}
                          className="text-base font-bold text-slate-900 hover:text-blue-600 transition"
                        >
                          {item.title}
                        </Link>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Posted by <strong className="text-slate-700">{item.companyName}</strong> (Company ID #{item.companyId}) • {item.country}{item.city ? `, ${item.city}` : ''} • Current Status: <strong className="font-semibold">{item.status}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <RiskBadge score={item.riskScore} level={item.riskLevel} reasons={item.riskReasons} />
                    </div>
                  </div>

                  {/* Triggered Reasons Breakdown */}
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1.5 text-xs">
                    <p className="font-bold text-slate-700">Triggered Risk Indicators:</p>
                    {item.riskReasons && item.riskReasons.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1 text-slate-600">
                        {item.riskReasons.map((r, idx) => (
                          <li key={idx} className="text-rose-700 font-medium">
                            {r}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-400 italic">No specific indicators logged.</p>
                    )}
                  </div>

                  {/* Admin Governance Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 text-xs">
                    <div className="text-slate-400">
                      Assessed: {item.assessedAt ? new Date(item.assessedAt).toLocaleString() : 'Recent'}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={reanalyzingId === item.internshipId}
                        onClick={() => handleReanalyzeRisk(item.internshipId)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        {reanalyzingId === item.internshipId ? 'Re-analyzing...' : 'Re-Run Risk Analysis'}
                      </button>

                      {item.status !== 'CLOSED' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(item.internshipId, 'CLOSED')}
                          className="rounded-lg bg-rose-600 px-3 py-1.5 font-semibold text-white hover:bg-rose-700 transition"
                        >
                          Takedown (Close Posting)
                        </button>
                      )}

                      {item.status !== 'ACTIVE' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(item.internshipId, 'ACTIVE')}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-700 transition"
                        >
                          Approve (Set Active)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: VERIFICATIONS */}
      {activeTab === 'verifications' && (
        <div className="space-y-4">
          <div className="flex gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setVerificationSubTab('email')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                verificationSubTab === 'email'
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Email Verification Tokens ({emailVerifications.length})
            </button>
            <button
              onClick={() => setVerificationSubTab('blockchain')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                verificationSubTab === 'blockchain'
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Issued Credential Ledger ({blockchainRecords.length})
            </button>
          </div>

          {loadingVerifications ? (
            <SkeletonLoader variant="table-block" count={5} />
          ) : verificationSubTab === 'email' ? (
            /* Email Verifications Table */
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Target Entity</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Token Preview</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Verified / Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {emailVerifications.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 text-slate-400">#{ev.id}</td>
                      <td className="px-4 py-3 font-sans font-bold text-slate-800">
                        {ev.targetName} ({ev.targetType})
                      </td>
                      <td className="px-4 py-3 font-sans text-slate-600">{ev.email}</td>
                      <td className="px-4 py-3 text-slate-500">{ev.token?.substring(0, 16)}...</td>
                      <td className="px-4 py-3 font-sans">
                        {ev.verified ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            Verified
                          </span>
                        ) : ev.expired ? (
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                            Expired
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-sans text-slate-500">
                        {ev.verifiedAt
                          ? `Verified: ${new Date(ev.verifiedAt).toLocaleString()}`
                          : `Expires: ${new Date(ev.expiry).toLocaleString()}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Blockchain Records Table */
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3">Credential ID</th>
                    <th className="px-4 py-3">Student & Company</th>
                    <th className="px-4 py-3">Internship</th>
                    <th className="px-4 py-3">Transaction Hash</th>
                    <th className="px-4 py-3">Network</th>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {blockchainRecords.map((br) => (
                    <tr key={br.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 font-mono font-bold text-blue-700">
                        {br.credentialId}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{br.studentName || 'Student'}</p>
                        <p className="text-slate-500 text-[11px]">{br.companyName || 'Company'}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{br.internshipTitle}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                        {br.transactionHash ? `${br.transactionHash.substring(0, 14)}...` : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{br.network}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {br.timestamp ? new Date(br.timestamp).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/verify-credential/${encodeURIComponent(br.credentialId)}`}
                          target="_blank"
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
                        >
                          Verify on Ledger →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
