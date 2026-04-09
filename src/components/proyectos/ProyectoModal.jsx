import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

const MONEDAS = ['USD', 'MXN', 'EUR', 'COP', 'ARS', 'CLP']

const INITIAL = {
  nombre: '',
  descripcion: '',
  monto_inversion_inicial: '',
  monto_respaldo_inicial: '',
  moneda: 'USD',
}

/**
 * ProyectoModal — crear o editar un proyecto
 * Props:
 *   open: boolean
 *   onClose: () => void
 *   userId: string
 *   onCreated: () => void
 *   proyecto?: object  — si se pasa, modo edición
 *   onUpdated?: () => void
 */
export function ProyectoModal({ open, onClose, userId, onCreated, proyecto, onUpdated }) {
  const isEdit = Boolean(proyecto)
  const [form, setForm] = useState(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Rellenar formulario cuando estamos en modo edición
  useEffect(() => {
    if (open && isEdit) {
      setForm({
        nombre: proyecto.nombre ?? '',
        descripcion: proyecto.descripcion ?? '',
        monto_inversion_inicial: String(proyecto.monto_inversion_inicial ?? ''),
        monto_respaldo_inicial: String(proyecto.monto_respaldo_inicial ?? ''),
        moneda: proyecto.moneda ?? 'USD',
      })
    }
    if (open && !isEdit) {
      setForm(INITIAL)
    }
    setError(null)
  }, [open, isEdit, proyecto])

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return }
    if (!form.monto_inversion_inicial || Number(form.monto_inversion_inicial) <= 0) {
      setError('La inversión inicial debe ser mayor a 0.'); return
    }
    if (!form.monto_respaldo_inicial || Number(form.monto_respaldo_inicial) <= 0) {
      setError('El respaldo inicial debe ser mayor a 0.'); return
    }

    setLoading(true)

    if (isEdit) {
      const { error: dbError } = await supabase
        .from('proyectos')
        .update({
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() || null,
          monto_inversion_inicial: Number(form.monto_inversion_inicial),
          monto_respaldo_inicial: Number(form.monto_respaldo_inicial),
          moneda: form.moneda,
        })
        .eq('id', proyecto.id)

      setLoading(false)
      if (dbError) {
        setError(dbError.message)
      } else {
        onUpdated?.()
        onClose()
      }
    } else {
      const { error: dbError } = await supabase.from('proyectos').insert({
        user_id: userId,
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        monto_inversion_inicial: Number(form.monto_inversion_inicial),
        monto_respaldo_inicial: Number(form.monto_respaldo_inicial),
        moneda: form.moneda,
      })
      setLoading(false)

      if (dbError) {
        setError(dbError.message)
      } else {
        setForm(INITIAL)
        onCreated?.()
        onClose()
      }
    }
  }

  function handleClose() {
    setForm(INITIAL)
    setError(null)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title={isEdit ? 'Editar Proyecto' : 'Nuevo Proyecto'}>
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="proy-nombre"
          label="Nombre del proyecto *"
          placeholder="ej. Deuda tarjeta VISA"
          value={form.nombre}
          onChange={(e) => set('nombre', e.target.value)}
        />

        <Input
          id="proy-desc"
          label="Descripción (opcional)"
          placeholder="Una breve descripción..."
          value={form.descripcion}
          onChange={(e) => set('descripcion', e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="proy-inversion"
            label="Inversión inicial *"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.monto_inversion_inicial}
            onChange={(e) => set('monto_inversion_inicial', e.target.value)}
          />
          <Input
            id="proy-respaldo"
            label="Respaldo inicial *"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.monto_respaldo_inicial}
            onChange={(e) => set('monto_respaldo_inicial', e.target.value)}
          />
        </div>

        {/* Moneda selector */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="proy-moneda" className="text-sm font-medium text-accent-light">
            Moneda
          </label>
          <select
            id="proy-moneda"
            value={form.moneda}
            onChange={(e) => set('moneda', e.target.value)}
            className="w-full bg-dark-bg border border-border-dark rounded-lg px-4 py-3 text-accent-light
                       focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
                       transition-all duration-200"
          >
            {MONEDAS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            {isEdit ? 'Guardar Cambios' : 'Crear Proyecto'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
