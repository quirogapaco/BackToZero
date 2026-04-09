import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

/**
 * ConfirmDeleteModal
 * Props:
 *   open: boolean
 *   onClose: () => void
 *   proyecto: { id, nombre }
 *   onDeleted: () => void  — se llama tras eliminar exitosamente
 */
export function ConfirmDeleteModal({ open, onClose, proyecto, onDeleted }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleDelete() {
    if (!proyecto) return
    setLoading(true)
    setError(null)

    // Eliminar transacciones primero (por si no hay ON DELETE CASCADE en Supabase)
    const { error: txError } = await supabase
      .from('transacciones')
      .delete()
      .eq('proyecto_id', proyecto.id)

    if (txError) {
      setLoading(false)
      setError(txError.message)
      return
    }

    // Eliminar el proyecto
    const { error: proyError } = await supabase
      .from('proyectos')
      .delete()
      .eq('id', proyecto.id)

    setLoading(false)

    if (proyError) {
      setError(proyError.message)
    } else {
      onDeleted()
      onClose()
    }
  }

  function handleClose() {
    if (loading) return
    setError(null)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Eliminar Proyecto">
      <div className="space-y-5">
        {/* Ícono de advertencia */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-danger/10 border border-danger/30 flex items-center justify-center">
            <span className="text-3xl">🗑️</span>
          </div>
        </div>

        {/* Mensaje principal */}
        <div className="text-center space-y-2">
          <p className="text-accent-light font-semibold text-base">
            ¿Eliminar{' '}
            <span className="text-danger">"{proyecto?.nombre}"</span>?
          </p>
          <p className="text-accent-light/50 text-sm leading-relaxed">
            Si eliminas este proyecto <strong className="text-accent-light/70">ya no podrás acceder a él</strong>.
            Todos los datos y transacciones registradas serán eliminados{' '}
            <strong className="text-danger">sin opción de revertir</strong>.
          </p>
        </div>

        {/* Caja de advertencia */}
        <div className="flex items-start gap-3 bg-danger/5 border border-danger/20 rounded-xl px-4 py-3">
          <span className="text-danger mt-0.5 flex-shrink-0">⚠️</span>
          <p className="text-danger/80 text-xs leading-relaxed">
            Esta acción es <strong>permanente e irreversible</strong>. Se eliminarán el proyecto y 
            todas sus transacciones de la base de datos.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
            {error}
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-3 pt-1">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2
                       bg-danger hover:bg-danger/80 text-white font-bold
                       py-3 px-4 rounded-lg transition-colors duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-lg shadow-danger/20"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Eliminando…
              </>
            ) : (
              'Sí, eliminar proyecto'
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}
