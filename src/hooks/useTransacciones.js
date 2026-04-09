import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const PAGE_SIZE = 20

const INITIAL_FILTERS = {
  busqueda: '',
  tipo: 'TODOS',
  categoriaId: null,
  fechaInicio: '',
  fechaFin: '',
}

/**
 * useTransacciones
 * Lazy loading (20 en 20) + filtros server-side + JOIN con categorias.
 *
 * @param {string} proyectoId
 * @returns {{
 *   transacciones: Array,
 *   loading: boolean,
 *   loadingMore: boolean,
 *   hasMore: boolean,
 *   error: string|null,
 *   filters: object,
 *   setFilter: (field, value) => void,
 *   loadMore: () => void,
 *   refetch: () => void,
 * }}
 */
export function useTransacciones(proyectoId) {
  const [transacciones, setTransacciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const offsetRef = useRef(0)

  // Construye la query de Supabase con los filtros actuales
  function buildQuery(currentFilters, from, to) {
    let q = supabase
      .from('transacciones')
      .select(`
        id, tipo, monto, descripcion, afecta_meta, afecta_respaldo, fecha, categoria_id,
        categorias ( id, nombre, icono, color )
      `)
      .eq('proyecto_id', proyectoId)
      .order('fecha', { ascending: false })
      .range(from, to)

    if (currentFilters.tipo !== 'TODOS') {
      q = q.eq('tipo', currentFilters.tipo)
    }
    if (currentFilters.categoriaId) {
      q = q.eq('categoria_id', currentFilters.categoriaId)
    }
    if (currentFilters.busqueda.trim()) {
      q = q.ilike('descripcion', `%${currentFilters.busqueda.trim()}%`)
    }
    if (currentFilters.fechaInicio) {
      q = q.gte('fecha', currentFilters.fechaInicio)
    }
    if (currentFilters.fechaFin) {
      // Incluir todo el día final
      q = q.lte('fecha', currentFilters.fechaFin + 'T23:59:59.999Z')
    }

    return q
  }

  // Carga (o recarga) desde el principio
  const fetchData = useCallback(async (currentFilters = filters) => {
    if (!proyectoId) return
    setLoading(true)
    setError(null)
    offsetRef.current = 0

    const { data, error: err } = await buildQuery(currentFilters, 0, PAGE_SIZE - 1)

    setLoading(false)
    if (err) { setError(err.message); return }

    setTransacciones(data ?? [])
    setHasMore((data ?? []).length === PAGE_SIZE)
    offsetRef.current = (data ?? []).length
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectoId])

  // ✅ Carga inicial al montar el componente
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Cargar más (página siguiente)
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)

    const from = offsetRef.current
    const to = from + PAGE_SIZE - 1
    const { data, error: err } = await buildQuery(filters, from, to)

    setLoadingMore(false)
    if (err) { setError(err.message); return }

    setTransacciones((prev) => [...prev, ...(data ?? [])])
    setHasMore((data ?? []).length === PAGE_SIZE)
    offsetRef.current += (data ?? []).length
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingMore, hasMore, filters, proyectoId])

  // Setea un filtro individual y recarga desde cero
  function setFilter(field, value) {
    const newFilters = { ...filters, [field]: value }
    setFilters(newFilters)
    fetchData(newFilters)
  }

  // Setea múltiples filtros en un solo update atómico (evita doble fetch)
  function setFiltersBatch(partialFilters) {
    const newFilters = { ...filters, ...partialFilters }
    setFilters(newFilters)
    fetchData(newFilters)
  }

  return {
    transacciones,
    loading,
    loadingMore,
    hasMore,
    error,
    filters,
    setFilter,
    setFiltersBatch,
    loadMore,
    refetch: () => fetchData(filters),
  }
}
