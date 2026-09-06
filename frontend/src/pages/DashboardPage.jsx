import { useAuth } from '../auth/AuthContext.jsx'

function DashboardPage() {
  const { user } = useAuth()

  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-slate-600">
        Signed in as <span className="font-medium text-slate-900">{user?.name}</span> ({user?.role}).
      </p>
      <p className="text-sm text-slate-500">
        This area is behind the protected-route wrapper. Role-specific APIs are restricted on the backend.
      </p>
    </section>
  )
}

export default DashboardPage
