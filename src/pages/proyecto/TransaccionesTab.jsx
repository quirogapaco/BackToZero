import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useTransacciones } from '../../hooks/useTransacciones'
import { FiltrosTransacciones } from '../../components/transacciones/FiltrosTransacciones'
import { TransaccionModal } from '../../components/transacciones/TransaccionModal'
import { TxItem } from '../../components/transacciones/TxItem'
import { getIconComponent } from '../../types/categorias'
import { FiEdit2, FiTrash2, FiLoader } from 'react-icons/fi'

function fmt(valor, moneda = 'USD') {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: moneda || 'USD', maximumFractionDigits: 2,
  }).format(valor ?? 0)
}
function fmtFecha(iso) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

export function TransaccionesTab() {
  const { proyecto } = useOutletContext()
  const moneda = proyecto.moneda || 'USD'

  const {
    transacciones, loading, loadingMore, hasMore, error,
    filters, setFilter, setFiltersBatch, loadMore, refetch,
  } = useTransacciones(proyecto.id)

  // Modal crear/editar
  const [modalTipo, setModalTipo] = useState(null)      // 'INGRESO' | 'GASTO'
  const [editTx, setEditTx]       = useState(null)      // transaccion a editar
  // Modal confirmar eliminación
  const [deleteTx, setDeleteTx]   = useState(null)
  const [deleting, setDeleting]   = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  async function handleDelete() {
    if (!deleteTx) return
    setDeleting(true)
    setDeleteError(null)
    const { error: err } = await supabase.from('transacciones').delete().eq('id', deleteTx.id)
    setDeleting(false)
    if (err) { setDeleteError(err.message); return }
    setDeleteTx(null)
    refetch()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h1 className="text-lg font-bold text-accent-light">Transacciones</h1>
          <p className="text-accent-light/40 text-xs mt-0.5">
            {transacciones.length} movimiento{transacciones.length !== 1 ? 's' : ''} cargado{transacciones.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setEditTx(null); setModalTipo('INGRESO') }}
            className="flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-dark-bg font-bold
                       px-4 py-2.5 rounded-xl text-sm transition-colors duration-200 shadow-lg shadow-accent/20"
          >
            ↑ Ingreso
          </button>
          <button
            onClick={() => { setEditTx(null); setModalTipo('GASTO') }}
            className="flex items-center gap-1.5 bg-dark-card border border-danger/40
                       hover:bg-danger/10 hover:border-danger text-danger font-bold
                       px-4 py-2.5 rounded-xl text-sm transition-colors duration-200"
          >
            ↓ Gasto
          </button>
        </div>
      </div>

      {/* Filtros */}
      <FiltrosTransacciones filters={filters} onChange={setFilter} onBatch={setFiltersBatch} />

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
          {error}
        </div>
      )}

      {/* Loading inicial */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <svg className="animate-spin h-8 w-8 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      )}

      {/* Lista de transacciones */}
      {!loading && (
        <>
          {transacciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <div className="text-4xl">📭</div>
              <p className="text-accent-light/40 text-sm">
                {filters.busqueda || filters.tipo !== 'TODOS' || filters.fechaInicio || filters.fechaFin
                  ? 'No hay resultados con los filtros actuales.'
                  : 'Aún no hay transacciones en este proyecto.'}
              </p>
            </div>
          ) : (
            <div className="bg-dark-card border border-border-dark rounded-2xl overflow-hidden">
              <ul className="divide-y divide-border-dark/40">
                {transacciones.map((tx) => (
                  <TxItem
                    key={tx.id}
                    tx={tx}
                    moneda={moneda}
                    onEdit={() => { setEditTx(tx); setModalTipo(tx.tipo) }}
                    onDelete={() => setDeleteTx(tx)}
                  />
                ))}
              </ul>

              {/* Cargar más */}
              {hasMore && (
                <div className="px-6 py-4 border-t border-border-dark/40">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                               border border-border-dark text-accent-light/60 hover:border-accent hover:text-accent
                               text-sm font-medium transition-colors duration-200 disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <><FiLoader size={15} className="animate-spin" /> Cargando...</>
                    ) : (
                      'Cargar más transacciones'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal crear / editar */}
      <TransaccionModal
        open={Boolean(modalTipo)}
        onClose={() => { setModalTipo(null); setEditTx(null) }}
        tipo={modalTipo}
        proyectoId={proyecto.id}
        transaccion={editTx}
        onCreated={() => { refetch(); setModalTipo(null); setEditTx(null) }}
      />

      {/* Diálogo confirmar eliminación */}
      {deleteTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !deleting && setDeleteTx(null)} />
          <div className="relative bg-dark-card border border-border-dark rounded-2xl p-6 w-full max-w-sm z-10 space-y-4">
            <div className="text-center space-y-2">
              <div className="text-3xl">🗑️</div>
              <h3 className="text-accent-light font-bold text-base">¿Eliminar movimiento?</h3>
              <p className="text-accent-light/50 text-sm leading-relaxed">
                {deleteTx.descripcion
                  ? `"${deleteTx.descripcion}"`
                  : `${deleteTx.tipo === 'INGRESO' ? 'Ingreso' : 'Gasto'} de ${fmt(deleteTx.monto, moneda)}`}
              </p>
              <p className="text-accent-light/40 text-xs">Esta acción no se puede deshacer.</p>
            </div>
            {deleteError && (
              <p className="text-danger text-xs text-center">{deleteError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTx(null)}
                disabled={deleting}
                className="flex-1 border border-border-dark rounded-lg py-2.5 text-accent-light/70 text-sm hover:border-accent/40 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-danger hover:bg-red-700 text-white font-bold py-2.5 rounded-lg text-sm
                           transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? <FiLoader size={15} className="animate-spin" /> : null}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
