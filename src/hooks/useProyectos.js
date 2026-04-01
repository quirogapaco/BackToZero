import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Calcula el monto pendiente por recuperar de un proyecto:
 * pendiente = inversion_inicial - ingresos_meta + gastos_meta
 */
function calcularPendiente(proyecto, transacciones) {
  const txs = transacciones.filter((t) => t.proyecto_id === proyecto.id && t.afecta_meta)
  const ingresos = txs.filter((t) => t.tipo === 'INGRESO').reduce((sum, t) => sum + Number(t.monto), 0)
  const gastos  = txs.filter((t) => t.tipo === 'GASTO').reduce((sum, t) => sum + Number(t.monto), 0)
  return Number(proyecto.monto_inversion_inicial) - ingresos + gastos
}

export function useProyectos(userId) {
  const [proyectos, setProyectos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)

    try {
      // 1. Proyectos del usuario
      const { data: proyData, error: proyError } = await supabase
        .from('proyectos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (proyError) throw proyError

      if (!proyData.length) {
        setProyectos([])
        return
      }

      // 2. Transacciones de esos proyectos (afecta_meta únicamente para el cálculo)
      const ids = proyData.map((p) => p.id)
      const { data: txData, error: txError } = await supabase
        .from('transacciones')
        .select('proyecto_id, tipo, monto, afecta_meta')
        .in('proyecto_id', ids)
        .eq('afecta_meta', true)

      if (txError) throw txError

      // 3. Enriquecer proyectos con pendiente calculado
      const enriched = proyData.map((p) => ({
        ...p,
        pendiente: calcularPendiente(p, txData ?? []),
      }))

      setProyectos(enriched)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { proyectos, loading, error, refetch: fetchData }
}
