import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { ProyectoPage } from './pages/proyecto/ProyectoPage'

function App() {
  const [session, setSession] = useState(undefined) // undefined = cargando
  const [view, setView] = useState('login')            // 'login' | 'register'
  const [proyectoActivo, setProyectoActivo] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) setProyectoActivo(null) // limpiar al logout
    })
    return () => subscription.unsubscribe()
  }, [])

  // Pantalla de carga inicial
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

  // Sin sesión → Auth
  if (!session) {
    if (view === 'register') return <RegisterPage onNavigateToLogin={() => setView('login')} />
    return <LoginPage onNavigateToRegister={() => setView('register')} />
  }

  // Sesión activa → Proyecto detalle o Dashboard
  if (proyectoActivo) {
    return (
      <ProyectoPage
        proyecto={proyectoActivo}
        onBack={() => setProyectoActivo(null)}
      />
    )
  }

  return (
    <DashboardPage
      session={session}
      onSelectProyecto={(p) => setProyectoActivo(p)}
    />
  )
}

export default App
