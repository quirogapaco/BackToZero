import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { useCategorias } from '../../context/CategoriasContext'
import { getIconComponent } from '../../types/categorias'

const INITIAL = {
  monto: '',
  descripcion: '',
  categoria_id: null,
  afecta_meta: true,
  afecta_respaldo: true,
}

/**
 * TransaccionModal — crear o editar una transacción
 * Props:
 *   open: boolean
 *   onClose: () => void
 *   tipo: 'INGRESO' | 'GASTO'
 *   proyectoId: string
 *   transaccion?: object   — si se pasa, modo edición
 *   onCreated: () => void
 */
export function TransaccionModal({ open, onClose, tipo, proyectoId, transaccion, onCreated }) {
  const [form, setForm] = useState(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const { categorias } = useCategorias()
  const isEdit = Boolean(transaccion)
  const isIngreso = tipo === 'INGRESO'
  const titulo = isIngreso ? '↑ Registrar Ingreso' : '↓ Registrar Gasto'

  const categoriasFiltradas = categorias.filter(
    (c) => c.tipo === tipo || c.tipo === 'AMBOS'
  )

  // Pre-cargar datos si estamos editando
  useEffect(() => {
    if (open && isEdit && transaccion) {
      setForm({
        monto: String(transaccion.monto ?? ''),
        descripcion: transaccion.descripcion ?? '',
        categoria_id: transaccion.categoria_id ?? null,
        afecta_meta: transaccion.afecta_meta ?? true,
        afecta_respaldo: transaccion.afecta_respaldo ?? true,
      })
    }
    if (open && !isEdit) setForm(INITIAL)
    setError(null)
  }, [open, isEdit, transaccion])

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!form.monto || Number(form.monto) <= 0) { setError('El monto debe ser mayor a 0.'); return }

    setLoading(true)
    let dbError

    if (isEdit) {
      ;({ error: dbError } = await supabase
        .from('transacciones')
        .update({
          monto: Number(form.monto),
          descripcion: form.descripcion.trim() || null,
          categoria_id: form.categoria_id || null,
          afecta_meta: form.afecta_meta,
          afecta_respaldo: form.afecta_respaldo,
        })
        .eq('id', transaccion.id))
    } else {
      ;({ error: dbError } = await supabase.from('transacciones').insert({
        proyecto_id: proyectoId,
        tipo,
        monto: Number(form.monto),
        descripcion: form.descripcion.trim() || null,
        categoria_id: form.categoria_id || null,
        afecta_meta: form.afecta_meta,
        afecta_respaldo: form.afecta_respaldo,
        fecha: new Date().toISOString(),
      }))
    }

    setLoading(false)
    if (dbError) { setError(dbError.message); return }
    onCreated()
  }

  function handleClose() { setForm(INITIAL); setError(null); onClose() }

  return (
    <Modal open={open} onClose={handleClose} title={isEdit ? `Editar ${isIngreso ? 'Ingreso' : 'Gasto'}` : titulo}>
      <p className={`text-xs mb-5 ${isIngreso ? 'text-accent' : 'text-danger'}`}>
        {isEdit
          ? 'Modifica los datos de este movimiento.'
          : isIngreso ? 'Registra dinero que entra a este proyecto.' : 'Registra dinero que sale de este proyecto.'}
      </p>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          id="tx-monto" label="Monto *" type="number" min="0.01" step="0.01" placeholder="0.00"
          value={form.monto} onChange={(e) => set('monto', e.target.value)}
        />
        <Input
          id="tx-desc" label="Descripción (opcional)"
          placeholder={isIngreso ? 'ej. Pago parcial tarjeta' : 'ej. Transferencia necesaria'}
          value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)}
        />

        {categoriasFiltradas.length > 0 && (
          <CategorySelector
            categorias={categoriasFiltradas}
            selected={form.categoria_id}
            onSelect={(id) => set('categoria_id', id === form.categoria_id ? null : id)}
          />
        )}

        <div className="space-y-3">
          <p className="text-xs font-semibold text-accent-light/50 uppercase tracking-widest">
            ¿Qué afecta este movimiento?
          </p>
          <InfoToggle
            id="tx-meta" label="¿Recuperar Inversión?"
            tooltip={isIngreso
              ? 'Si marcas esto, el dinero se restará de tu deuda inicial para acercarte al punto cero.'
              : 'Si marcas esto, el monto sumará a tu deuda (alejándote del cero).'}
            checked={form.afecta_meta} onChange={(v) => set('afecta_meta', v)}
          />
          <InfoToggle
            id="tx-respaldo" label="¿Manejar Efectivo?"
            tooltip="Si marcas esto, el monto se sumará o restará de tu dinero disponible."
            checked={form.afecta_respaldo} onChange={(v) => set('afecta_respaldo', v)}
          />
        </div>

        <ImpactSummary tipo={tipo} afectaMeta={form.afecta_meta} afectaRespaldo={form.afecta_respaldo} />

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={handleClose}
            className="flex-1 border border-border-dark rounded-lg py-3 text-accent-light/70 hover:border-accent/40 text-sm font-medium transition-colors duration-200">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className={`flex-1 py-3 rounded-lg font-bold text-sm transition-colors duration-200
              disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2
              ${isIngreso ? 'bg-accent hover:bg-accent-hover text-dark-bg shadow-lg shadow-accent/20'
                          : 'bg-danger hover:bg-red-700 text-white shadow-lg shadow-danger/20'}`}>
            {loading ? (
              <><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                Guardando…</>
            ) : isEdit ? 'Guardar Cambios' : isIngreso ? 'Guardar Ingreso' : 'Guardar Gasto'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function CategorySelector({ categorias, selected, onSelect }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-accent-light/50 uppercase tracking-widest">
        Categoría <span className="text-accent-light/30 normal-case font-normal">(opcional)</span>
      </p>
      <div className="grid grid-cols-3 gap-2">
        {categorias.map((cat) => {
          const IconComp = getIconComponent(cat.icono)
          const isSelected = selected === cat.id
          return (
            <button key={cat.id} type="button" onClick={() => onSelect(cat.id)}
              className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border text-center
                transition-all duration-200 group
                ${isSelected ? 'border-transparent shadow-md scale-[1.03]' : 'border-border-dark bg-dark-bg hover:border-accent/40 hover:scale-[1.02]'}`}
              style={isSelected ? { backgroundColor: cat.color + '22', borderColor: cat.color } : {}}
              title={cat.nombre}
            >
              <IconComp size={18}
                style={{ color: isSelected ? cat.color : undefined }}
                className={!isSelected ? 'text-accent-light/50 group-hover:text-accent-light' : ''}
              />
              <span className={`text-[10px] font-medium leading-tight line-clamp-2
                ${isSelected ? '' : 'text-accent-light/50 group-hover:text-accent-light'}`}
                style={isSelected ? { color: cat.color } : {}}>
                {cat.nombre}
              </span>
            </button>
          )
        })}
      </div>
      {selected && (() => {
        const cat = categorias.find(c => c.id === selected)
        if (!cat) return null
        const IconComp = getIconComponent(cat.icono)
        return (
          <div className="flex items-center gap-2 mt-1 px-3 py-2 rounded-lg"
            style={{ backgroundColor: cat.color + '18', border: `1px solid ${cat.color}40` }}>
            <IconComp size={13} style={{ color: cat.color }} />
            <span className="text-xs font-medium" style={{ color: cat.color }}>{cat.nombre}</span>
            <button type="button" onClick={() => onSelect(selected)}
              className="ml-auto text-accent-light/30 hover:text-accent-light transition-colors text-xs">✕</button>
          </div>
        )
      })()}
    </div>
  )
}

function InfoToggle({ id, label, tooltip, checked, onChange }) {
  const [showTip, setShowTip] = useState(false)
  return (
    <label htmlFor={id}
      className="flex items-start justify-between gap-4 bg-dark-bg border border-border-dark rounded-xl px-4 py-3 cursor-pointer hover:border-accent/40 transition-colors duration-200">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-accent-light text-sm font-medium">{label}</p>
          <button type="button" onClick={(e) => { e.preventDefault(); setShowTip(!showTip) }}
            className="w-4 h-4 rounded-full border border-accent-light/30 text-accent-light/40 hover:border-accent hover:text-accent transition-colors duration-200 flex items-center justify-center text-xs leading-none flex-shrink-0">
            ?
          </button>
        </div>
        {showTip && <p className="text-accent-light/50 text-xs mt-1.5 leading-relaxed">{tooltip}</p>}
      </div>
      <div className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 mt-0.5 ${checked ? 'bg-accent' : 'bg-border-dark'}`}>
        <input id={id} type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
    </label>
  )
}

function ImpactSummary({ tipo, afectaMeta, afectaRespaldo }) {
  if (!afectaMeta && !afectaRespaldo) {
    return <p className="text-xs text-accent-light/30 text-center py-2">⚠️ Sin toggles activos, la transacción no afectará ningún indicador.</p>
  }
  const isIngreso = tipo === 'INGRESO'
  const items = []
  if (afectaMeta) items.push(isIngreso ? '✓ Reducirá tu deuda pendiente' : '✓ Incrementará tu deuda pendiente')
  if (afectaRespaldo) items.push(isIngreso ? '✓ Sumará a tu dinero disponible' : '✓ Restará de tu dinero disponible')
  return (
    <div className="rounded-lg bg-dark-bg border border-border-dark/60 px-4 py-3 space-y-1">
      <p className="text-accent-light/40 text-xs font-semibold uppercase tracking-widest mb-2">Impacto de este movimiento</p>
      {items.map((item) => <p key={item} className="text-accent-light/70 text-xs">{item}</p>)}
    </div>
  )
}
