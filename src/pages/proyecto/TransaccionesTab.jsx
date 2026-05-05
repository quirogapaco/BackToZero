import { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useTransacciones } from '../../hooks/useTransacciones'
import { FiltrosTransacciones } from '../../components/transacciones/FiltrosTransacciones'
import { TransaccionModal } from '../../components/transacciones/TransaccionModal'
import { TxItem } from '../../components/transacciones/TxItem'
import { getIconComponent } from '../../types/categorias'
import { FiEdit2, FiTrash2, FiLoader, FiCheckSquare, FiX } from 'react-icons/fi'

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
  // Selección de transacciones
  const [seleccionMode, setSeleccionMode] = useState(false)
  const [selectedIds, setSelectedIds]     = useState(new Set())

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

  function toggleSeleccionMode() {
    setSeleccionMode((v) => !v)
    setSelectedIds(new Set())
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelectedIds(new Set(transacciones.map((tx) => tx.id)))
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  // Cálculos del resumen de selección
  const seleccionadas = useMemo(
    () => transacciones.filter((tx) => selectedIds.has(tx.id)),
    [transacciones, selectedIds],
  )

  const resumenSeleccion = useMemo(() => {
    let totalIngresos = 0
    let totalGastos = 0
    const porCategoria = {}

    seleccionadas.forEach((tx) => {
      const monto = Number(tx.monto || 0)
      if (tx.tipo === 'INGRESO') {
        totalIngresos += monto
      } else {
        totalGastos += monto
      }
      const catKey = tx.categorias ? tx.categorias.nombre : 'Sin categoría'
      if (!porCategoria[catKey]) {
        porCategoria[catKey] = { nombre: catKey, ingreso: 0, gasto: 0, color: tx.categorias?.color }
      }
      tx.tipo === 'INGRESO'
        ? (porCategoria[catKey].ingreso += monto)
        : (porCategoria[catKey].gasto += monto)
    })

    return { totalIngresos, totalGastos, neto: totalIngresos - totalGastos, porCategoria: Object.values(porCategoria) }
  }, [seleccionadas])

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
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={toggleSeleccionMode}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors duration-200 border
              ${seleccionMode
                ? 'bg-accent/10 border-accent text-accent'
                : 'bg-dark-card border-border-dark text-accent-light/60 hover:border-accent/50 hover:text-accent-light'
              }`}
          >
            <FiCheckSquare size={15} />
            {seleccionMode ? 'Cancelar' : 'Seleccionar'}
          </button>
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
              {/* Barra de selección cuando hay modo activo */}
              {seleccionMode && (
                <div className="px-4 sm:px-6 py-2.5 bg-accent/5 border-b border-accent/20 flex items-center justify-between gap-2 text-xs">
                  <span className="text-accent-light/60">
                    {selectedIds.size} seleccionada{selectedIds.size !== 1 ? 's' : ''}
                  </span>
                  <div className="flex gap-3">
                    <button
                      onClick={selectAll}
                      className="text-accent hover:underline font-medium"
                    >
                      Seleccionar todas
                    </button>
                    {selectedIds.size > 0 && (
                      <button
                        onClick={clearSelection}
                        className="flex items-center gap-1 text-accent-light/40 hover:text-danger font-medium"
                      >
                        <FiX size={11} /> Limpiar
                      </button>
                    )}
                  </div>
                </div>
              )}

              <ul className="divide-y divide-border-dark/40">
                {transacciones.map((tx) => (
                  <TxItem
                    key={tx.id}
                    tx={tx}
                    moneda={moneda}
                    seleccionMode={seleccionMode}
                    isSelected={selectedIds.has(tx.id)}
                    onToggleSelect={() => toggleSelect(tx.id)}
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

      {/* Tabla resumen de transacciones seleccionadas */}
      {seleccionMode && selectedIds.size > 0 && (
        <div className="bg-dark-card border border-accent/30 rounded-2xl overflow-hidden shadow-lg shadow-accent/5">
          {/* Header de la tabla */}
          <div className="px-4 sm:px-6 py-3 border-b border-border-dark/50 flex items-center justify-between">
            <div>
              <h2 className="text-accent-light font-semibold text-sm">
                Resumen de selección
              </h2>
              <p className="text-accent-light/40 text-xs mt-0.5">
                {selectedIds.size} transacción{selectedIds.size !== 1 ? 'es' : ''} seleccionada{selectedIds.size !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={clearSelection}
              className="p-1.5 rounded-lg text-accent-light/30 hover:text-danger hover:bg-danger/10 transition-colors"
              title="Limpiar selección"
            >
              <FiX size={15} />
            </button>
          </div>

          {/* Tabla detallada */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-dark/50 bg-dark-bg/40">
                  <th className="px-4 sm:px-6 py-2.5 text-left text-accent-light/40 font-semibold uppercase tracking-wider">Descripción</th>
                  <th className="px-3 py-2.5 text-left text-accent-light/40 font-semibold uppercase tracking-wider hidden sm:table-cell">Categoría</th>
                  <th className="px-3 py-2.5 text-left text-accent-light/40 font-semibold uppercase tracking-wider hidden sm:table-cell">Fecha</th>
                  <th className="px-4 sm:px-6 py-2.5 text-right text-accent-light/40 font-semibold uppercase tracking-wider">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark/30">
                {seleccionadas.map((tx) => {
                  const isIngreso = tx.tipo === 'INGRESO'
                  const cat = tx.categorias
                  return (
                    <tr key={tx.id} className="hover:bg-dark-surface/30 transition-colors">
                      <td className="px-4 sm:px-6 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-base flex-shrink-0 ${isIngreso ? 'text-accent' : 'text-danger'}`}>
                            {isIngreso ? '↑' : '↓'}
                          </span>
                          <span className="text-accent-light font-medium truncate max-w-[140px] sm:max-w-none">
                            {tx.descripcion || (isIngreso ? 'Ingreso' : 'Gasto')}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 hidden sm:table-cell">
                        {cat ? (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
                            style={{ backgroundColor: cat.color + '22', color: cat.color, border: `1px solid ${cat.color}40` }}
                          >
                            {cat.nombre}
                          </span>
                        ) : (
                          <span className="text-accent-light/30">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-accent-light/40 hidden sm:table-cell whitespace-nowrap">
                        {fmtFecha(tx.fecha)}
                      </td>
                      <td className={`px-4 sm:px-6 py-2.5 text-right font-bold ${isIngreso ? 'text-accent' : 'text-danger'}`}>
                        {isIngreso ? '+' : '-'}{fmt(tx.monto, moneda)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="border-t border-border-dark/50 bg-dark-bg/40 px-4 sm:px-6 py-3 space-y-1.5">
            {resumenSeleccion.porCategoria.length > 1 && (
              <div className="pb-2 mb-1 border-b border-border-dark/40 space-y-1">
                <p className="text-[10px] font-semibold text-accent-light/40 uppercase tracking-widest mb-1">Por categoría</p>
                {resumenSeleccion.porCategoria.map((cat) => (
                  <div key={cat.nombre} className="flex items-center justify-between text-xs">
                    <span
                      className="font-medium"
                      style={{ color: cat.color || 'rgba(176,228,204,0.7)' }}
                    >
                      {cat.nombre}
                    </span>
                    <div className="flex gap-3">
                      {cat.ingreso > 0 && (
                        <span className="text-accent">+{fmt(cat.ingreso, moneda)}</span>
                      )}
                      {cat.gasto > 0 && (
                        <span className="text-danger">-{fmt(cat.gasto, moneda)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-accent-light/50">Total ingresos</span>
              <span className="text-accent font-bold">+{fmt(resumenSeleccion.totalIngresos, moneda)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-accent-light/50">Total gastos</span>
              <span className="text-danger font-bold">-{fmt(resumenSeleccion.totalGastos, moneda)}</span>
            </div>
            <div className="flex justify-between text-sm pt-1 border-t border-border-dark/40 mt-1">
              <span className="text-accent-light font-semibold">Neto</span>
              <span className={`font-extrabold ${resumenSeleccion.neto >= 0 ? 'text-accent' : 'text-danger'}`}>
                {resumenSeleccion.neto >= 0 ? '+' : ''}{fmt(resumenSeleccion.neto, moneda)}
              </span>
            </div>
          </div>
        </div>
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

/* ── Item de transacción ── */
function TxItem({ tx, moneda, seleccionMode, isSelected, onToggleSelect, onEdit, onDelete }) {
  const isIngreso = tx.tipo === 'INGRESO'
  const cat = tx.categorias
  const IconComp = cat ? getIconComponent(cat.icono) : null

  return (
    <li
      className={`px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3 transition-colors duration-150 group
        ${seleccionMode ? 'cursor-pointer' : ''}
        ${isSelected ? 'bg-accent/5' : 'hover:bg-dark-surface/50'}`}
      onClick={seleccionMode ? onToggleSelect : undefined}
    >
      {/* Izquierda — checkbox (modo selección) o indicador tipo */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {seleccionMode ? (
          <span
            className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors duration-150
              ${isSelected ? 'bg-accent border-accent' : 'border-border-dark bg-transparent'}`}
          >
            {isSelected && (
              <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 fill-dark-bg" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
        ) : (
          <span className={`text-xl flex-shrink-0 ${isIngreso ? 'text-accent' : 'text-danger'}`}>
            {isIngreso ? '↑' : '↓'}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-accent-light text-xs sm:text-sm font-medium truncate">
              {tx.descripcion || (isIngreso ? 'Ingreso' : 'Gasto')}
            </p>
            {/* Badge categoría */}
            {cat && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0"
                style={{ backgroundColor: cat.color + '22', color: cat.color, border: `1px solid ${cat.color}40` }}
              >
                {IconComp && <IconComp size={10} />}
                {cat.nombre}
              </span>
            )}
          </div>
          <p className="text-accent-light/30 text-xs mt-0.5">{fmtFecha(tx.fecha)}</p>
        </div>
      </div>

      {/* Derecha — monto + acciones */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`font-bold text-xs sm:text-sm ${isIngreso ? 'text-accent' : 'text-danger'}`}>
          {isIngreso ? '+' : '-'}{fmt(tx.monto, moneda)}
        </span>

        {/* Botones: ocultos en modo selección */}
        {!seleccionMode && (
          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={onEdit}
              title="Editar"
              className="p-1.5 rounded-lg text-accent-light/30 hover:text-accent hover:bg-accent/10 transition-colors"
            >
              <FiEdit2 size={14} />
            </button>
            <button
              onClick={onDelete}
              title="Eliminar"
              className="p-1.5 rounded-lg text-accent-light/30 hover:text-danger hover:bg-danger/10 transition-colors"
            >
              <FiTrash2 size={14} />
            </button>
          </div>
        )}
      </div>
    </li>
  )
}
