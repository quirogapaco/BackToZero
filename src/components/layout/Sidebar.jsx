import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { FiBarChart2, FiList, FiArrowLeft, FiMenu, FiX } from 'react-icons/fi'

/**
 * Sidebar del proyecto
 * Props:
 *   proyecto: { id, nombre, descripcion }
 */
export function Sidebar({ proyecto }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()

  const base = `/proyecto/${proyecto.id}`

  const links = [
    { to: `${base}/dashboard`,       icon: FiBarChart2, label: 'Dashboard' },
    { to: `${base}/transacciones`,   icon: FiList,      label: 'Transacciones' },
  ]

  const linkCls = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
    ${isActive
      ? 'bg-accent/15 text-accent border border-accent/30'
      : 'text-accent-light/60 hover:bg-dark-surface hover:text-accent-light'
    }`

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header proyecto */}
      <div className="px-4 pt-5 pb-4 border-b border-border-dark/50">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-accent-light/40 hover:text-accent text-xs mb-3 transition-colors"
        >
          <FiArrowLeft size={13} />
          Proyectos
        </button>
        <h2 className="text-accent font-bold text-sm leading-tight truncate">
          {proyecto.nombre}
        </h2>
        {proyecto.descripcion && (
          <p className="text-accent-light/30 text-xs mt-0.5 truncate">
            {proyecto.descripcion}
          </p>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-3 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={linkCls} onClick={() => setMobileOpen(false)}>
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-dark-card border-r border-border-dark/50 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* ── Mobile: top bar con hamburger ── */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-dark-card border-b border-border-dark/50 sticky top-0 z-30">
        <div className="min-w-0">
          <p className="text-accent font-bold text-sm truncate">{proyecto.nombre}</p>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-accent-light/60 hover:text-accent hover:bg-dark-surface transition-colors"
        >
          <FiMenu size={20} />
        </button>
      </div>

      {/* ── Mobile drawer overlay ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 bg-dark-card border-r border-border-dark h-full flex flex-col z-10">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-accent-light/40 hover:text-accent-light transition-colors"
            >
              <FiX size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}
