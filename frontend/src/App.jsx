import { BrowserRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from './auth/AuthContext.jsx'
import ProtectedRoute from './auth/ProtectedRoute.jsx'
import TopProgressBar from './components/TopProgressBar.jsx'
import { MotionLink } from './components/MotionButton.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import MyInternshipsPage from './pages/company/MyInternshipsPage.jsx'
import CreateInternshipPage from './pages/company/CreateInternshipPage.jsx'
import EditInternshipPage from './pages/company/EditInternshipPage.jsx'
import CompanyApplicationsPage from './pages/company/CompanyApplicationsPage.jsx'
import CompanyProfilePage from './pages/company/CompanyProfilePage.jsx'
import InternshipSearchPage from './pages/student/InternshipSearchPage.jsx'
import InternshipDetailPage from './pages/student/InternshipDetailPage.jsx'
import ResumeUploadPage from './pages/student/ResumeUploadPage.jsx'
import RecommendationsPage from './pages/student/RecommendationsPage.jsx'
import MyApplicationsPage from './pages/student/MyApplicationsPage.jsx'
import VerifyEmailPage from './pages/VerifyEmailPage.jsx'
import VerifyCredentialPage from './pages/VerifyCredentialPage.jsx'
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import ResetPasswordPage from './pages/ResetPasswordPage.jsx'

/**
 * Animated NavLink with smoothly sliding active indicator via layoutId (Category 8)
 */
function AnimatedNavLink({ to, children }) {
  return (
    <NavLink
      to={to}
      className="relative px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors"
    >
      {({ isActive }) => (
        <>
          <span
            className={`relative z-10 transition-colors duration-150 ${
              isActive ? 'font-bold text-primary-700' : 'text-slate-600 hover:text-primary-700'
            }`}
          >
            {children}
          </span>
          {isActive && (
            <motion.span
              layoutId="active-nav-indicator"
              className="absolute inset-0 rounded-lg bg-primary-50 border border-primary-200/80 shadow-2xs"
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            />
          )}
        </>
      )}
    </NavLink>
  )
}

function NavBar() {
  const { isAuthenticated, logout, user } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b border-warm-border bg-white/90 backdrop-blur-md transition-all">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-6 py-3 text-sm">
        {/* Brand */}
        <NavLink
          to="/"
          className="mr-3 flex items-center gap-2 font-heading text-lg font-extrabold text-primary-700 tracking-tight transition hover:opacity-90"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-700 text-white shadow-sm">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-slate-900">Intern<span className="text-primary-700">iqo</span></span>
        </NavLink>

        {/* Company nav links */}
        {isAuthenticated && user?.role === 'COMPANY' && (
          <div className="flex items-center gap-1">
            <AnimatedNavLink to="/company/internships">My Listings</AnimatedNavLink>
            <AnimatedNavLink to="/company/applications">Applications</AnimatedNavLink>
            <AnimatedNavLink to="/company/internships/new">Post Internship</AnimatedNavLink>
            <AnimatedNavLink to="/company/profile">Profile</AnimatedNavLink>
          </div>
        )}

        {/* Student nav links */}
        {isAuthenticated && user?.role === 'STUDENT' && (
          <div className="flex items-center gap-1">
            <AnimatedNavLink to="/student/internships">Browse Internships</AnimatedNavLink>
            <AnimatedNavLink to="/student/recommendations">Recommendations</AnimatedNavLink>
            <AnimatedNavLink to="/student/applications">My Applications</AnimatedNavLink>
            <AnimatedNavLink to="/student/resume">Resume</AnimatedNavLink>
          </div>
        )}

        {/* Admin nav links */}
        {isAuthenticated && user?.role === 'ADMIN' && (
          <AnimatedNavLink to="/admin">Admin Console</AnimatedNavLink>
        )}

        {/* Public Verify Credential */}
        <AnimatedNavLink to="/verify-credential">Verify Credential</AnimatedNavLink>

        {/* Auth section — pushed to the right */}
        {isAuthenticated ? (
          <div className="ml-auto flex items-center gap-3">
            <AnimatedNavLink to="/dashboard">Dashboard</AnimatedNavLink>
            <div className="hidden sm:flex items-center gap-2 border-l border-warm-border pl-3">
              <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-800">
                {user?.role}
              </span>
              <span className="max-w-[160px] truncate text-xs font-medium text-slate-500">
                {user?.name || user?.email}
              </span>
            </div>
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-lg border border-warm-border bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
              onClick={logout}
            >
              Sign out
            </motion.button>
          </div>
        ) : (
          <div className="ml-auto flex items-center gap-2">
            <AnimatedNavLink to="/login">Sign in</AnimatedNavLink>
            <MotionLink
              to="/register"
              variant="primary"
              pulse={true}
              className="text-xs px-3.5 py-1.5"
            >
              Get Started
            </MotionLink>
          </div>
        )}
      </nav>
    </header>
  )
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-warm-border bg-white text-xs text-slate-500">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <div className="flex items-center gap-2 font-heading font-semibold text-slate-800">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary-700 text-[10px] font-bold text-white">
            I
          </span>
          Interniqo
          <span className="text-slate-400 font-normal">
            · © {new Date().getFullYear()} Interniqo, Inc. All rights reserved.
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-5 text-slate-600">
          <NavLink to="/student/internships" className="hover:text-primary-700 transition">
            Opportunities
          </NavLink>
          <NavLink to="/verify-credential" className="hover:text-primary-700 transition">
            Verify Credential
          </NavLink>
          <span className="text-slate-300">|</span>
          <span className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
            Privacy Policy
          </span>
          <span className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
            Terms of Service
          </span>
          <span className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
            Contact Support
          </span>
        </div>
      </div>
    </footer>
  )
}

function AppRoutes() {
  const location = useLocation()

  return (
    <>
      <TopProgressBar />
      <NavBar />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <Routes location={location}>
              {/* Public */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/verify-credential" element={<VerifyCredentialPage />} />
              <Route path="/verify-credential/:credentialId" element={<VerifyCredentialPage />} />

              {/* Generic authenticated */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Detail page — any authenticated user (company or student) */}
              <Route
                path="/internships/:id"
                element={
                  <ProtectedRoute>
                    <InternshipDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Company-only */}
              <Route
                path="/company/internships"
                element={
                  <ProtectedRoute requiredRole="COMPANY">
                    <MyInternshipsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/company/applications"
                element={
                  <ProtectedRoute requiredRole="COMPANY">
                    <CompanyApplicationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/company/internships/new"
                element={
                  <ProtectedRoute requiredRole="COMPANY">
                    <CreateInternshipPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/company/internships/:id/edit"
                element={
                  <ProtectedRoute requiredRole="COMPANY">
                    <EditInternshipPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/company/profile"
                element={
                  <ProtectedRoute requiredRole="COMPANY">
                    <CompanyProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Student-only */}
              <Route
                path="/student/internships"
                element={
                  <ProtectedRoute requiredRole="STUDENT">
                    <InternshipSearchPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/recommendations"
                element={
                  <ProtectedRoute requiredRole="STUDENT">
                    <RecommendationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/applications"
                element={
                  <ProtectedRoute requiredRole="STUDENT">
                    <MyApplicationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/resume"
                element={
                  <ProtectedRoute requiredRole="STUDENT">
                    <ResumeUploadPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin-only */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex min-h-screen flex-col bg-[#faf8f5] text-slate-800">
          <AppRoutes />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

