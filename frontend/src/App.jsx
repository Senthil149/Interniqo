import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext.jsx'
import ProtectedRoute from './auth/ProtectedRoute.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import HealthPage from './pages/HealthPage.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'

function NavBar() {
  const { isAuthenticated, logout, user } = useAuth()

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-3xl flex-wrap items-center gap-4 px-6 py-4 text-sm">
        <NavLink className="font-medium text-slate-700 hover:text-slate-900" to="/">
          Home
        </NavLink>
        <NavLink className="font-medium text-slate-700 hover:text-slate-900" to="/health">
          Health
        </NavLink>
        {isAuthenticated ? (
          <>
            <NavLink className="font-medium text-slate-700 hover:text-slate-900" to="/dashboard">
              Dashboard
            </NavLink>
            <span className="ml-auto text-slate-500">{user?.email}</span>
            <button className="font-medium text-slate-700 hover:text-slate-900" type="button" onClick={logout}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <NavLink className="ml-auto font-medium text-slate-700 hover:text-slate-900" to="/login">
              Sign in
            </NavLink>
            <NavLink className="font-medium text-slate-700 hover:text-slate-900" to="/register">
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
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/health" element={<HealthPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
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
