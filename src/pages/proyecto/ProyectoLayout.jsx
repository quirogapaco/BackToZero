import { Outlet, useParams, Navigate } from 'react-router-dom'
import { Sidebar } from '../../components/layout/Sidebar'
import { useProyectos } from '../../hooks/useProyectos'

/**
 * ProyectoLayout
 * Layout raíz de cada proyecto: sidebar + contenido (Outlet).
 * Carga el proyecto desde el contexto global de proyectos.
 * Si el id no existe, redirige al dashboard.
 */
export function ProyectoLayout({ session }) {
  const { id } = useParams()
  const user = session?.user
  const { proyectos, loading } = useProyectos(user?.id)

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>
    )
  }

  const proyecto = proyectos.find((p) => p.id === id)
  if (!proyecto) return <Navigate to="/" replace />

  return (
    <div className="min-h-screen bg-dark-bg text-accent-light flex flex-col md:flex-row">
      <Sidebar proyecto={proyecto} />
      <main className="flex-1 min-w-0">
        <Outlet context={{ proyecto }} />
      </main>
    </div>
  )
}
