import { getIconComponent } from '../../types/categorias'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'

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

export function TxItem({ tx, moneda, onEdit, onDelete }) {
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
