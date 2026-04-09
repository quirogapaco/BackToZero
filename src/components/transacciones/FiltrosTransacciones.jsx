import { useState, useEffect, useRef } from 'react'
import { FiFilter, FiX, FiSearch, FiCalendar, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { useCategorias } from '../../context/CategoriasContext'
import { getIconComponent } from '../../types/categorias'

/**
 * FiltrosTransacciones
 * Props:
 *   filters: { busqueda, tipo, categoriaId, fechaInicio, fechaFin }
 *   onChange: (field, value) => void
 *   onBatch: (partialFilters) => void
 */
export function FiltrosTransacciones({ filters, onChange, onBatch }) {
  const { categorias } = useCategorias()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showDates, setShowDates] = useState(Boolean(filters.fechaInicio || filters.fechaFin))

  // ── Debounce para búsqueda: estado LOCAL, nunca causa re-render del padre ────
  const [localBusqueda, setLocalBusqueda] = useState(filters.busqueda)
  const debounceRef = useRef(null)

  function handleBusquedaChange(value) {
    setLocalBusqueda(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => onChange('busqueda', value), 450)
  }

  // Solo sincronizar si el padre resetea externamente
  useEffect(() => {
    if (filters.busqueda === '' && localBusqueda !== '') setLocalBusqueda('')
  }, [filters.busqueda]) // eslint-disable-line

  function toggleDates() {
    if (showDates) onBatch({ fechaInicio: '', fechaFin: '' })
    setShowDates((v) => !v)
  }

  const hayFiltros =
    filters.tipo !== 'TODOS' ||
    filters.categoriaId !== null ||
    localBusqueda.trim() !== '' ||
    filters.fechaInicio !== '' ||
    filters.fechaFin !== ''

  function limpiarTodo() {
    clearTimeout(debounceRef.current)
    setLocalBusqueda('')
    setShowDates(false)
    onBatch({ busqueda: '', tipo: 'TODOS', categoriaId: null, fechaInicio: '', fechaFin: '' })
  }

  const inputCls = `w-full bg-dark-bg border border-border-dark rounded-lg px-3 py-2.5
    text-accent-light text-sm placeholder:text-accent-light/30
    focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors duration-200`

  const selectCls = `bg-dark-bg border border-border-dark rounded-lg px-3 py-2.5
    text-accent-light text-sm focus:outline-none focus:ring-1 focus:ring-accent
    focus:border-accent transition-colors duration-200 w-full`

  // ────────────────────────────────────────────────────────────────────────────
  // ⚠️  NO usar un subcomponente <FiltersBody> aquí dentro.
  // Si se define un componente dentro del render, React lo desmonta/remonta en
  // cada re-render, destruyendo el foco del input. El JSX se inlinea directamente.
  // ────────────────────────────────────────────────────────────────────────────
  const filtersJsx = (
    <div className="space-y-3">
      {/* Búsqueda + tipo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-light/30 w-3.5 h-3.5 pointer-events-none" />
          <input
            className={inputCls + ' pl-8'}
            placeholder="Buscar descripción..."
            value={localBusqueda}
            onChange={(e) => handleBusquedaChange(e.target.value)}
          />
        </div>
        <select className={selectCls} value={filters.tipo} onChange={(e) => onChange('tipo', e.target.value)}>
          <option value="TODOS">Todos los tipos</option>
          <option value="INGRESO">Solo Ingresos</option>
          <option value="GASTO">Solo Gastos</option>
        </select>
      </div>

      {/* Chips de categoría */}
      {categorias.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-accent-light/40 uppercase tracking-widest">Categoría</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onChange('categoriaId', null)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors duration-150
                ${!filters.categoriaId
                  ? 'bg-accent/20 border-accent text-accent'
                  : 'border-border-dark text-accent-light/50 hover:border-accent/50 hover:text-accent-light'
                }`}
            >
              Todas
            </button>
            {categorias.map((cat) => {
              const IconComp = getIconComponent(cat.icono)
              const isSelected = filters.categoriaId === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onChange('categoriaId', isSelected ? null : cat.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150"
                  style={isSelected
                    ? { backgroundColor: cat.color + '25', borderColor: cat.color, color: cat.color }
                    : { borderColor: 'var(--color-border-dark)', color: 'rgba(176,228,204,0.5)' }
                  }
                >
                  <IconComp size={11} />
                  <span>{cat.nombre}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Toggle rango de fechas */}
      <div>
        <button
          type="button"
          onClick={toggleDates}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors duration-200
            ${showDates
              ? 'border-accent text-accent bg-accent/10'
              : 'border-border-dark text-accent-light/40 hover:border-accent/50 hover:text-accent-light'
            }`}
        >
          <FiCalendar size={12} className={showDates ? 'text-accent' : 'text-accent-light/60'} />
          {showDates ? 'Quitar rango de fechas' : 'Definir rango de fechas'}
          {showDates ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
        </button>

        {showDates && (
          <div className="grid grid-cols-2 gap-2.5 mt-2.5 p-3 bg-dark-bg rounded-xl border border-border-dark">
            <div className="space-y-1">
              <label className="text-[10px] text-accent-light/40 font-medium uppercase tracking-wider block">Desde</label>
              <div className="relative">
                <FiCalendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-accent/70 pointer-events-none z-10" />
                <input
                  type="date"
                  className={inputCls + ' pl-8 text-xs [color-scheme:dark]'}
                  value={filters.fechaInicio}
                  onChange={(e) => onChange('fechaInicio', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-accent-light/40 font-medium uppercase tracking-wider block">Hasta</label>
              <div className="relative">
                <FiCalendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-accent/70 pointer-events-none z-10" />
                <input
                  type="date"
                  className={inputCls + ' pl-8 text-xs [color-scheme:dark]'}
                  value={filters.fechaFin}
                  onChange={(e) => onChange('fechaFin', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-2">
      {/* Barra top */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className={`sm:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors duration-200
            ${mobileOpen || hayFiltros
              ? 'border-accent text-accent bg-accent/10'
              : 'border-border-dark text-accent-light/60 hover:border-accent/50'
            }`}
        >
          <FiFilter size={14} />
          Filtros
          {hayFiltros && <span className="w-1.5 h-1.5 rounded-full bg-accent ml-0.5" />}
        </button>
        {hayFiltros && (
          <button
            type="button"
            onClick={limpiarTodo}
            className="flex items-center gap-1 text-xs text-accent-light/40 hover:text-danger transition-colors duration-200 ml-auto"
          >
            <FiX size={12} /> Limpiar
          </button>
        )}
      </div>

      {/* Desktop: siempre visible */}
      <div className="hidden sm:block">{filtersJsx}</div>

      {/* Móvil: colapsable */}
      {mobileOpen && (
        <div className="sm:hidden bg-dark-card border border-border-dark rounded-xl p-3">
          {filtersJsx}
        </div>
      )}
    </div>
  )
}
