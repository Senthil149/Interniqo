import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import HealthPage from './pages/HealthPage.jsx'
import HomePage from './pages/HomePage.jsx'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <nav className="mx-auto flex max-w-3xl gap-4 px-6 py-4 text-sm">
            <NavLink className="font-medium text-slate-700 hover:text-slate-900" to="/">
              Home
            </NavLink>
            <NavLink className="font-medium text-slate-700 hover:text-slate-900" to="/health">
              Health
            </NavLink>
          </nav>
        </header>
        <main className="mx-auto max-w-3xl px-6 py-10">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/health" element={<HealthPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
