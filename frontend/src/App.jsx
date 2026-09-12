import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext.jsx'
import ProtectedRoute from './auth/ProtectedRoute.jsx'
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

const NAV_LINK =
  'font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50/60 rounded-lg px-3 py-1.5 transition-all duration-150 text-sm'
const NAV_LINK_ACTIVE =
  'font-semibold text-blue-600 bg-blue-50/90 rounded-lg px-3 py-1.5 transition-all duration-150 text-sm shadow-2xs'

function NavBar() {
  const { isAuthenticated, logout, user } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-all">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-6 py-3 text-sm">
        {/* Brand */}
        <NavLink
          to="/"
          className="mr-3 flex items-center gap-2 font-heading text-lg font-extrabold text-blue-600 tracking-tight transition hover:opacity-90"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-slate-900">Intern<span className="text-blue-600">iqo</span></span>
        </NavLink>

        {/* Company nav links */}
        {isAuthenticated && user?.role === 'COMPANY' && (
          <div className="flex items-center gap-1">
            <NavLink
              to="/company/internships"
              className={({ isActive }) => isActive ? NAV_LINK_ACTIVE : NAV_LINK}
            >
              My Listings
            </NavLink>
            <NavLink
              to="/company/applications"
              className={({ isActive }) => isActive ? NAV_LINK_ACTIVE : NAV_LINK}
            >
              Applications
            </NavLink>
            <NavLink
              to="/company/internships/new"
              className={({ isActive }) => isActive ? NAV_LINK_ACTIVE : NAV_LINK}
            >
              Post Internship
            </NavLink>
            <NavLink
              to="/company/profile"
              className={({ isActive }) => isActive ? NAV_LINK_ACTIVE : NAV_LINK}
            >
              Profile
            </NavLink>
          </div>
        )}

        {/* Student nav links */}
        {isAuthenticated && user?.role === 'STUDENT' && (
          <div className="flex items-center gap-1">
            <NavLink
              to="/student/internships"
              className={({ isActive }) => isActive ? NAV_LINK_ACTIVE : NAV_LINK}
            >
              Browse Internships
            </NavLink>
            <NavLink
              to="/student/recommendations"
              className={({ isActive }) => isActive ? NAV_LINK_ACTIVE : NAV_LINK}
            >
              AI Matches
            </NavLink>
            <NavLink
              to="/student/applications"
              className={({ isActive }) => isActive ? NAV_LINK_ACTIVE : NAV_LINK}
            >
              My Applications
            </NavLink>
            <NavLink
              to="/student/resume"
              className={({ isActive }) => isActive ? NAV_LINK_ACTIVE : NAV_LINK}
            >
              Resume
            </NavLink>
          </div>
        )}

        {/* Admin nav links */}
        {isAuthenticated && user?.role === 'ADMIN' && (
          <NavLink
            to="/admin"
            className={({ isActive }) => isActive ? NAV_LINK_ACTIVE : NAV_LINK}
          >
            Admin Console
          </NavLink>
        )}

        {/* Public Verify Credential */}
        <NavLink
          to="/verify-credential"
          className={({ isActive }) => isActive ? NAV_LINK_ACTIVE : NAV_LINK}
        >
          Verify Credential
        </NavLink>

        {/* Auth section — pushed to the right */}
        {isAuthenticated ? (
          <div className="ml-auto flex items-center gap-3">
            <NavLink
              to="/dashboard"
              className={({ isActive }) => isActive ? NAV_LINK_ACTIVE : NAV_LINK}
            >
              Dashboard
            </NavLink>
            <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 pl-3">
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-800">
                {user?.role}
              </span>
              <span className="max-w-[160px] truncate text-xs font-medium text-slate-500">
                {user?.name || user?.email}
              </span>
            </div>
            <button
              type="button"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
              onClick={logout}
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="ml-auto flex items-center gap-2">
            <NavLink
              to="/login"
              className={({ isActive }) => isActive ? NAV_LINK_ACTIVE : NAV_LINK}
            >
              Sign in
            </NavLink>
            <NavLink
              to="/register"
              className="btn-primary text-xs px-3.5 py-1.5"
            >
              Get Started
            </NavLink>
          </div>
        )}
      </nav>
    </header>
  )
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white text-xs text-slate-500">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <div className="flex items-center gap-2 font-heading font-semibold text-slate-800">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-600 text-[10px] font-bold text-white">
            I
          </span>
          Interniqo Platform
          <span className="text-slate-400 font-normal">· IEEE Project Demo</span>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <span className="inline-flex items-center gap-1.5 text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            SBERT Match Engine Active
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-500">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Ethereum Smart Contracts Ready
          </span>
          <NavLink to="/verify-credential" className="hover:text-blue-600 transition">
            Public Verifier
          </NavLink>
        </div>
      </div>
    </footer>
  )
}

function AppRoutes() {
  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Routes>
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
      </main>
      <Footer />
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
          <AppRoutes />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
