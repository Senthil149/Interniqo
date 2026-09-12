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
  'font-medium text-slate-600 hover:text-slate-900 transition-colors'
const NAV_LINK_ACTIVE =
  'font-medium text-indigo-600'

function NavBar() {
  const { isAuthenticated, logout, user } = useAuth()

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-6 py-3 text-sm">
        {/* Brand */}
        <NavLink
          to="/"
          className="mr-2 text-base font-bold text-indigo-600 tracking-tight"
        >
          Interniqo
        </NavLink>

        {/* Company nav links */}
        {isAuthenticated && user?.role === 'COMPANY' && (
          <>
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
          </>
        )}

        {/* Student nav links */}
        {isAuthenticated && user?.role === 'STUDENT' && (
          <>
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
              AI Recommendations
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
              My Resume
            </NavLink>
          </>
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
          <>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `ml-auto ${isActive ? NAV_LINK_ACTIVE : NAV_LINK}`}
            >
              Dashboard
            </NavLink>
            <span className="max-w-xs truncate text-slate-400">{user?.email}</span>
            <button
              type="button"
              className={NAV_LINK}
              onClick={logout}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `ml-auto ${isActive ? NAV_LINK_ACTIVE : NAV_LINK}`}
            >
              Sign in
            </NavLink>
            <NavLink
              to="/register"
              className="rounded-lg bg-indigo-600 px-3 py-1.5 font-semibold text-white transition hover:bg-indigo-700"
            >
              Register
            </NavLink>
          </>
        )}
      </nav>
    </header>
  )
}

function AppRoutes() {
  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-7xl px-6 py-10">
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
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <AppRoutes />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
