import { useEffect } from 'react'

/**
 * Modal reutilizable
 * Props:
 *   open: boolean
 *   onClose: () => void
 *   title: string
 *   children: ReactNode
 */
export function Modal({ open, onClose, title, children }) {
  // Cerrar con Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel — bottom-sheet en mobile, centrado en sm+ */}
      <div className="relative w-full sm:max-w-lg bg-dark-card border border-border-dark
                      rounded-t-2xl sm:rounded-2xl shadow-2xl z-10
                      max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 sm:px-8 sm:pt-7 border-b border-border-dark/40 sticky top-0 bg-dark-card z-10">
          <h2 className="text-base sm:text-xl font-bold text-accent-light">{title}</h2>
          <button
            onClick={onClose}
            className="text-accent-light/40 hover:text-accent-light transition-colors text-lg leading-none p-1"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-5 sm:px-8 sm:py-6">
          {children}
        </div>
      </div>
    </div>
  )
}
