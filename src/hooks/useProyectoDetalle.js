import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useProyectoDetalle(proyectoId) {
  const [resumen, setResumen] = useState(null)
  const [transacciones, setTransacciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    if (!proyectoId) return
    setLoading(true)
    setError(null)

    try {
      // 1. Resumen desde la vista
      const { data: resData, error: resError } = await supabase
        .from('resumen_proyectos')
        .select('*')
        .eq('proyecto_id', proyectoId)
        .single()

      if (resError) throw resError

      // 2. Últimas 5 transacciones
      const { data: txData, error: txError } = await supabase
        .from('transacciones')
        .select('*')
        .eq('proyecto_id', proyectoId)
        .order('fecha', { ascending: false })
        .limit(5)

      if (txError) throw txError

      setResumen(resData)
      setTransacciones(txData ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [proyectoId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { resumen, transacciones, loading, error, refetch: fetchData }
}
