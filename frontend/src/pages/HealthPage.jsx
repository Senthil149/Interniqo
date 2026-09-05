import api from '../api/http.js'

const frontendHealth = {
  service: 'frontend',
  status: 'ok',
  backendBaseUrl: api.defaults.baseURL,
}

function HealthPage() {
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold tracking-tight">Frontend health</h1>
      <pre className="rounded-lg bg-slate-900 p-4 text-sm text-slate-100">
        {JSON.stringify(frontendHealth, null, 2)}
      </pre>
    </section>
  )
}

export default HealthPage
