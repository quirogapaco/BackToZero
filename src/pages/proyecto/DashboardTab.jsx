import { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useProyectoDetalle } from '../../hooks/useProyectoDetalle'
import { TransaccionModal } from '../../components/transacciones/TransaccionModal'
import { GraficoEvolucion } from '../../components/dashboard/GraficoEvolucion'
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

export function DashboardTab() {
  const { proyecto } = useOutletContext()
  const { resumen, transacciones, loading, error, refetch } = useProyectoDetalle(proyecto.id)
  const [modalTipo, setModalTipo] = useState(null)
  const [txFiltro, setTxFiltro]   = useState('RECIENTES') // 'RECIENTES' o 'HOY'
  const [txLimit, setTxLimit]     = useState(10) // 10 o 20
  const [editTx, setEditTx]       = useState(null)
  const [deleteTx, setDeleteTx]   = useState(null)
  const [deleting, setDeleting]   = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const moneda = proyecto.moneda || 'USD'

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
  const inversion = Number(proyecto.monto_inversion_inicial)
  const pendiente = Number(resumen?.pendiente_recuperacion ?? inversion)
  const respaldo = Number(resumen?.saldo_respaldo_actual ?? proyecto.monto_respaldo_inicial)
  const recuperado = inversion > 0 ? Math.min(100, Math.max(0, ((inversion - pendiente) / inversion) * 100)) : 0
  const estaRecuperado = pendiente <= 0

  // ---------- FILTROS TRANSACCIONES DASHBOARD ----------
  const txsList = useMemo(() => {
    if (txFiltro === 'HOY') {
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      return transacciones.filter(t => new Date(t.fecha) >= hoy)
    }
    return transacciones.slice(0, txLimit)
  }, [transacciones, txFiltro, txLimit])

  const txsHoyTotales = useMemo(() => {
    if (txFiltro !== 'HOY') return null
    let ing = 0, gas = 0
    txsList.forEach(t => t.tipo === 'INGRESO' ? (ing += Number(t.monto || 0)) : (gas += Number(t.monto || 0)))
    return { ing, gas }
  }, [txsList, txFiltro])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-5 sm:space-y-8">
      {error && (
        <div className="px-4 py-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
          Error al cargar datos: {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      ) : (
        <>
          {/* Welcome Header */}
          <div className="pt-2">
            <p className="text-accent-light/40 text-xs sm:text-sm tracking-wide">Resumen de tu Inversión</p>
          </div>
          
          {/* Botones de Acción */}
          <div className="flex flex-row gap-3">
            <button
              onClick={() => setModalTipo('INGRESO')}
              className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-dark-bg font-extrabold py-3.5 rounded-full transition-colors duration-200 shadow-lg shadow-accent/20 text-sm"
            >
              <span className="text-lg leading-none">+</span> Nuevo Ingreso
            </button>
            <button
              onClick={() => setModalTipo('GASTO')}
              className="flex-1 flex items-center justify-center gap-2 bg-danger hover:bg-red-700 text-white font-extrabold py-3.5 rounded-full transition-colors duration-200 shadow-lg shadow-danger/20 text-sm"
            >
              <span className="text-lg leading-none">-</span> Nuevo Gasto
            </button>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className={`bg-dark-card border rounded-2xl p-4 sm:p-6 overflow-hidden ${estaRecuperado ? 'border-accent/50' : 'border-border-dark'}`}>
              <p className="text-accent-light/50 text-xs uppercase tracking-widest mb-2">Pendiente por recuperar</p>
              {estaRecuperado ? (
                <>
                  <p className="text-accent text-2xl sm:text-3xl font-extrabold truncate w-full">¡Recuperado!</p>
                  <p className="text-accent/70 text-xs sm:text-sm mt-1">🎉 La inversión fue recuperada</p>
                </>
              ) : (
                <>
                  <p className="text-danger text-2xl sm:text-3xl font-extrabold truncate w-full">{fmt(pendiente, moneda)}</p>
                  <p className="text-accent-light/40 text-xs mt-1 truncate w-full">de {fmt(inversion, moneda)} inicial</p>
                </>
              )}
            </div>
            <div className="bg-dark-card border border-border-dark rounded-2xl p-4 sm:p-6 overflow-hidden">
              <p className="text-accent-light/50 text-xs uppercase tracking-widest mb-2">Dinero Disponible</p>
              <p className={`text-2xl sm:text-3xl font-extrabold truncate w-full ${respaldo >= 0 ? 'text-accent-light' : 'text-danger'}`}>
                {fmt(respaldo, moneda)}
              </p>
              <p className="text-accent-light/40 text-xs mt-1 truncate w-full">Respaldo actual del proyecto</p>
            </div>
          </div>

          {/* Progreso */}
          <div className="px-1 sm:px-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-accent-light/70 text-sm font-medium">Progreso de recuperación</p>
              <p className="text-accent font-bold text-sm">{recuperado.toFixed(1)}%</p>
            </div>
            <div className="h-3 bg-dark-bg rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${recuperado}%`,
                  background: estaRecuperado ? 'var(--color-accent)' : 'linear-gradient(90deg, var(--color-accent-hover), var(--color-accent))',
                }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-accent-light/30 text-xs">0%</span>
              <span className="text-accent-light/30 text-xs">100%</span>
            </div>
          </div>

          {/* Gráfico de Evolución */}
          <GraficoEvolucion proyectoId={proyecto.id} moneda={moneda} />

          {/* Contenedor Movimientos */}
          <div className="bg-dark-card border border-border-dark rounded-2xl overflow-hidden shadow-lg mt-6">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border-dark/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-accent-light font-semibold text-sm">
                {txFiltro === 'RECIENTES' ? 'Últimos movimientos' : 'Movimientos de Hoy'}
              </h2>
              <div className="flex bg-dark-bg p-1 rounded-lg border border-border-dark/50 w-fit">
                <button
                  onClick={() => { setTxFiltro('RECIENTES'); setTxLimit(10); }}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${txFiltro === 'RECIENTES' ? 'bg-dark-card text-accent shadow-sm' : 'text-accent-light/40 hover:text-accent-light'}`}
                >
                  Recientes
                </button>
                <button
                  onClick={() => setTxFiltro('HOY')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${txFiltro === 'HOY' ? 'bg-dark-card text-accent shadow-sm' : 'text-accent-light/40 hover:text-accent-light'}`}
                >
                  Hoy
                </button>
              </div>
            </div>

            {/* Totales de Hoy */}
            {txFiltro === 'HOY' && txsHoyTotales && (
              <div className="px-4 sm:px-6 py-3 bg-dark-bg/60 border-b border-border-dark/50 flex justify-between items-center text-xs">
                <span className="font-bold text-accent drop-shadow-sm flex gap-1"><span className="text-accent/50 hidden sm:inline">Ingresos hoy:</span> +{fmt(txsHoyTotales.ing, moneda)}</span>
                <span className="font-bold text-danger drop-shadow-sm flex gap-1"><span className="text-danger/50 hidden sm:inline">Gastos hoy:</span> -{fmt(txsHoyTotales.gas, moneda)}</span>
              </div>
            )}

            {txsList.length === 0 ? (
              <div className="px-4 sm:px-6 py-10 text-center text-accent-light/30 text-sm">
                {txFiltro === 'HOY' ? 'No hay transacciones el día de hoy.' : 'No hay transacciones recientes.'}
              </div>
            ) : (
              <>
                <ul className="divide-y divide-border-dark/40">
                  {txsList.map((tx) => (
                    <TxItem
                      key={tx.id}
                      tx={tx}
                      moneda={moneda}
                      onEdit={() => { setEditTx(tx); setModalTipo(tx.tipo) }}
                      onDelete={() => setDeleteTx(tx)}
                    />
                  ))}
                </ul>
                
                {/* Botón Ver Más para la vista de RECIENTES */}
                {txFiltro === 'RECIENTES' && transacciones.length > 10 && txLimit === 10 && (
                  <div className="p-3 border-t border-border-dark/50">
                    <button
                      onClick={() => setTxLimit(20)}
                      className="w-full text-center text-xs font-bold text-accent-light/50 hover:text-accent py-2 transition-colors duration-200"
                    >
                      Ver todos ({transacciones.length > 20 ? 'mostrando 20 de ' + transacciones.length : transacciones.length}) ↓
                    </button>
                  </div>
                )}
                {txFiltro === 'RECIENTES' && txLimit > 10 && (
                  <div className="p-3 border-t border-border-dark/50">
                    <button
                      onClick={() => setTxLimit(10)}
                      className="w-full text-center text-xs font-bold text-accent-light/50 hover:text-accent py-2 transition-colors duration-200"
                    >
                      Ver menos ↑
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

        </>
      )}

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
function TxItem({ tx, moneda, onEdit, onDelete }) {
  const isIngreso = tx.tipo === 'INGRESO'
  const cat = tx.categorias
  const IconComp = cat ? getIconComponent(cat.icono) : null

  return (
    <li className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3 hover:bg-dark-surface/50 transition-colors duration-150 group">
      {/* Izquierda — tipo + info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Indicador tipo */}
        <span className={`text-xl flex-shrink-0 ${isIngreso ? 'text-accent' : 'text-danger'}`}>
          {isIngreso ? '↑' : '↓'}
        </span>

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

        {/* Botones: siempre visibles en móvil, hover en desktop */}
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
      </div>
    </li>
  )
}
