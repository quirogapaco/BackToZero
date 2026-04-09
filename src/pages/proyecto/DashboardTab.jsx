import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useProyectoDetalle } from '../../hooks/useProyectoDetalle'
import { TransaccionModal } from '../../components/transacciones/TransaccionModal'

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

  const moneda = proyecto.moneda || 'USD'
  const inversion = Number(proyecto.monto_inversion_inicial)
  const pendiente = Number(resumen?.pendiente_recuperacion ?? inversion)
  const respaldo = Number(resumen?.saldo_respaldo_actual ?? proyecto.monto_respaldo_inicial)
  const recuperado = inversion > 0 ? Math.min(100, Math.max(0, ((inversion - pendiente) / inversion) * 100)) : 0
  const estaRecuperado = pendiente <= 0

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
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={`bg-dark-card border rounded-2xl p-4 sm:p-6 ${estaRecuperado ? 'border-accent/50' : 'border-border-dark'}`}>
              <p className="text-accent-light/50 text-xs uppercase tracking-widest mb-2">Pendiente por recuperar</p>
              {estaRecuperado ? (
                <>
                  <p className="text-accent text-2xl sm:text-3xl font-extrabold">¡Recuperado!</p>
                  <p className="text-accent/70 text-xs sm:text-sm mt-1">🎉 La inversión fue recuperada</p>
                </>
              ) : (
                <>
                  <p className="text-danger text-2xl sm:text-3xl font-extrabold">{fmt(pendiente, moneda)}</p>
                  <p className="text-accent-light/40 text-xs mt-1">de {fmt(inversion, moneda)} inicial</p>
                </>
              )}
            </div>
            <div className="bg-dark-card border border-border-dark rounded-2xl p-4 sm:p-6">
              <p className="text-accent-light/50 text-xs uppercase tracking-widest mb-2">Dinero Disponible</p>
              <p className={`text-2xl sm:text-3xl font-extrabold ${respaldo >= 0 ? 'text-accent-light' : 'text-danger'}`}>
                {fmt(respaldo, moneda)}
              </p>
              <p className="text-accent-light/40 text-xs mt-1">Respaldo actual del proyecto</p>
            </div>
          </div>

          {/* Progreso */}
          <div className="bg-dark-card border border-border-dark rounded-2xl p-4 sm:p-6">
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

          {/* Acciones rápidas */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setModalTipo('INGRESO')}
              className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover
                         text-dark-bg font-bold py-4 rounded-xl transition-colors duration-200
                         shadow-lg shadow-accent/20 text-sm"
            >
              <span className="text-lg">↑</span> Nuevo Ingreso
            </button>
            <button
              onClick={() => setModalTipo('GASTO')}
              className="flex-1 flex items-center justify-center gap-2 bg-dark-card border border-danger/40
                         hover:bg-danger/10 hover:border-danger text-danger font-bold py-4 rounded-xl
                         transition-colors duration-200 text-sm"
            >
              <span className="text-lg">↓</span> Nuevo Gasto
            </button>
          </div>

          {/* Últimos 5 movimientos */}
          <div className="bg-dark-card border border-border-dark rounded-2xl overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border-dark/50">
              <h2 className="text-accent-light font-semibold text-sm">Últimos movimientos</h2>
            </div>
            {transacciones.length === 0 ? (
              <div className="px-4 sm:px-6 py-8 text-center text-accent-light/30 text-sm">
                Aún no hay transacciones en este proyecto.
              </div>
            ) : (
              <ul className="divide-y divide-border-dark/40">
                {transacciones.map((tx) => (
                  <li key={tx.id} className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`text-xl flex-shrink-0 ${tx.tipo === 'INGRESO' ? 'text-accent' : 'text-danger'}`}>
                        {tx.tipo === 'INGRESO' ? '↑' : '↓'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-accent-light text-xs sm:text-sm font-medium truncate">
                          {tx.descripcion || (tx.tipo === 'INGRESO' ? 'Ingreso' : 'Gasto')}
                        </p>
                        <p className="text-accent-light/30 text-xs mt-0.5">{fmtFecha(tx.fecha)}</p>
                      </div>
                    </div>
                    <span className={`font-bold text-xs sm:text-sm flex-shrink-0 ${tx.tipo === 'INGRESO' ? 'text-accent' : 'text-danger'}`}>
                      {tx.tipo === 'INGRESO' ? '+' : '-'}{fmt(tx.monto, moneda)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      <TransaccionModal open={modalTipo === 'INGRESO'} onClose={() => setModalTipo(null)} tipo="INGRESO" proyectoId={proyecto.id} onCreated={refetch} />
      <TransaccionModal open={modalTipo === 'GASTO'}   onClose={() => setModalTipo(null)} tipo="GASTO"   proyectoId={proyecto.id} onCreated={refetch} />
    </div>
  )
}
