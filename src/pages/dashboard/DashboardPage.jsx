import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useProyectos } from '../../hooks/useProyectos'
import { ProyectoCard } from '../../components/proyectos/ProyectoCard'
import { ProyectoModal } from '../../components/proyectos/ProyectoModal'
import { ConfirmDeleteModal } from '../../components/proyectos/ConfirmDeleteModal'
import { Button } from '../../components/ui/Button'

export function DashboardPage({ session }) {
  const navigate = useNavigate()
  const user = session?.user
  const { proyectos, loading, error, refetch } = useProyectos(user?.id)

  const [modalOpen, setModalOpen] = useState(false)
  const [editProyecto, setEditProyecto] = useState(null)   // proyecto en edición
  const [deleteProyecto, setDeleteProyecto] = useState(null) // proyecto a eliminar

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  function handleEdit(proyecto) {
    setEditProyecto(proyecto)
  }

  function handleDelete(proyecto) {
    setDeleteProyecto(proyecto)
  }

  return (
    <div className="min-h-screen bg-dark-bg text-accent-light">

      {/* Navbar */}
      <header className="border-b border-border-dark/50 bg-dark-card sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <span className="text-xl sm:text-2xl font-extrabold text-accent">BackToZero</span>
          <div className="flex items-center gap-3">
            <span className="text-accent-light/40 text-xs hidden sm:block">{user?.email}</span>
            <button
              onClick={handleSignOut}
              className="text-xs sm:text-sm border border-border-dark px-2.5 py-1.5 rounded-lg text-accent-light/70
                         hover:border-accent hover:text-accent transition-colors duration-200"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* Título + CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-accent-light">Mis Proyectos</h1>
            <p className="text-accent-light/40 text-xs sm:text-sm mt-1">
              Gestiona tus metas de recuperación financiera
            </p>
          </div>
          {proyectos.length > 0 && (
            <Button onClick={() => setModalOpen(true)} className="sm:w-auto">
              + Nuevo Proyecto
            </Button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
            Error al cargar proyectos: {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <svg className="animate-spin h-8 w-8 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        )}

        {/* Estado vacío */}
        {!loading && !error && proyectos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center gap-5">
            <div className="text-5xl sm:text-6xl select-none">🌱</div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-accent-light mb-2">
                Empieza tu primer proyecto
              </h2>
              <p className="text-accent-light/40 text-sm max-w-sm mx-auto">
                Crea un proyecto para registrar una deuda o inversión que quieres recuperar.
                Te ayudaremos a llegar a cero.
              </p>
            </div>
            <Button onClick={() => setModalOpen(true)} className="max-w-xs">
              Crear Mi Primer Proyecto
            </Button>
          </div>
        )}

        {/* Grid de cards */}
        {!loading && proyectos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {proyectos.map((p) => (
              <ProyectoCard
                key={p.id}
                proyecto={p}
                onClick={(p) => navigate(`/proyecto/${p.id}/dashboard`)}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal crear proyecto */}
      <ProyectoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        userId={user?.id}
        onCreated={refetch}
      />

      {/* Modal editar proyecto */}
      <ProyectoModal
        open={Boolean(editProyecto)}
        onClose={() => setEditProyecto(null)}
        userId={user?.id}
        proyecto={editProyecto}
        onUpdated={() => { refetch(); setEditProyecto(null) }}
      />

      {/* Modal confirmar eliminación */}
      <ConfirmDeleteModal
        open={Boolean(deleteProyecto)}
        onClose={() => setDeleteProyecto(null)}
        proyecto={deleteProyecto}
        onDeleted={() => { refetch(); setDeleteProyecto(null) }}
      />
    </div>
  )
}
