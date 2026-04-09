/**
 * ProyectoCard
 * Props:
 *   proyecto: { id, nombre, descripcion, monto_inversion_inicial, monto_respaldo_inicial, moneda, pendiente }
 *   onClick: (proyecto) => void
 *   onEdit: (proyecto) => void
 *   onDelete: (proyecto) => void
 */

function fmt(valor, moneda = 'USD') {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: moneda || 'USD',
    maximumFractionDigits: 2,
  }).format(valor ?? 0)
}

export function ProyectoCard({ proyecto, onClick, onEdit, onDelete }) {
  const { nombre, descripcion, monto_inversion_inicial, monto_respaldo_inicial, moneda, pendiente } = proyecto
  const porcentajeRecuperado = Math.min(
    100,
    Math.max(0, ((monto_inversion_inicial - pendiente) / monto_inversion_inicial) * 100)
  )
  const recuperado = isFinite(porcentajeRecuperado) ? porcentajeRecuperado : 0

  return (
    <div className="relative group">
      <button
        onClick={() => onClick(proyecto)}
        className="text-left w-full bg-dark-card border border-border-dark rounded-2xl p-4 sm:p-6
                   hover:border-accent/60 hover:shadow-lg hover:shadow-accent/10
                   transition-all duration-200 flex flex-col gap-3 sm:gap-4"
      >
        {/* Header — espacio a la derecha para los botones de acción */}
        <div className="pr-20 sm:pr-20">
          <h3 className="text-accent font-bold text-base sm:text-lg group-hover:text-accent-light transition-colors duration-200 truncate">
            {nombre}
          </h3>
          {descripcion && (
            <p className="text-accent-light/40 text-xs mt-1 line-clamp-2">{descripcion}</p>
          )}
        </div>

        {/* Montos */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="bg-dark-bg rounded-xl p-2.5 sm:p-3">
            <p className="text-accent-light/40 text-[10px] sm:text-xs mb-1">Inversión inicial</p>
            <p className="text-accent-light font-semibold text-xs sm:text-sm">{fmt(monto_inversion_inicial, moneda)}</p>
          </div>
          <div className="bg-dark-bg rounded-xl p-2.5 sm:p-3">
            <p className="text-accent-light/40 text-[10px] sm:text-xs mb-1">Respaldo inicial</p>
            <p className="text-accent-light font-semibold text-xs sm:text-sm">{fmt(monto_respaldo_inicial, moneda)}</p>
          </div>
        </div>

        {/* Pendiente por recuperar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-accent-light/50 text-xs">Pendiente</span>
            <span className={`text-xs font-bold ${pendiente <= 0 ? 'text-accent' : 'text-accent-light'}`}>
              {pendiente <= 0 ? '¡Recuperado! 🎉' : fmt(pendiente, moneda)}
            </span>
          </div>
          <div className="h-1.5 bg-dark-bg rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${recuperado}%` }}
            />
          </div>
          <p className="text-accent-light/30 text-xs mt-1 text-right">{recuperado.toFixed(0)}% recuperado</p>
        </div>
      </button>

      {/*
        Botones de acción:
        - Móvil: siempre visibles (opacity-100)
        - Desktop: solo en hover del group (sm:opacity-0 sm:group-hover:opacity-100)
      */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5
                      opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(proyecto) }}
          title="Editar proyecto"
          className="w-8 h-8 flex items-center justify-center rounded-lg
                     bg-dark-bg border border-border-dark
                     text-accent-light/50 hover:text-accent hover:border-accent
                     transition-colors duration-200 text-sm"
        >
          ✏️
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(proyecto) }}
          title="Eliminar proyecto"
          className="w-8 h-8 flex items-center justify-center rounded-lg
                     bg-dark-bg border border-border-dark
                     text-accent-light/50 hover:text-danger hover:border-danger
                     transition-colors duration-200 text-sm"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}
