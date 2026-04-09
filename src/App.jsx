import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { CategoriasProvider } from './context/CategoriasContext'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { ProyectoLayout } from './pages/proyecto/ProyectoLayout'
import { DashboardTab } from './pages/proyecto/DashboardTab'
import { TransaccionesTab } from './pages/proyecto/TransaccionesTab'

function AppRoutes() {
  const [session, setSession] = useState(undefined)
  const [view, setView] = useState('login')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Loading
  if (session === undefined) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>
    )
  }

  // Sin sesión
  if (!session) {
    if (view === 'register') return <RegisterPage onNavigateToLogin={() => setView('login')} />
    return <LoginPage onNavigateToRegister={() => setView('register')} />
  }

  // Con sesión → Router
  return (
    <Routes>
      {/* Dashboard principal */}
      <Route
        path="/"
        element={<DashboardPage session={session} />}
      />

      {/* Rutas de proyecto */}
      <Route path="/proyecto/:id" element={<ProyectoLayout session={session} />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"     element={<DashboardTab />} />
        <Route path="transacciones" element={<TransaccionesTab />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <HashRouter>
      <CategoriasProvider>
        <AppRoutes />
      </CategoriasProvider>
    </HashRouter>
  )
}

export default App
