import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * CategoriasContext
 * Provee todas las categorías globales (tabla `categorias` de Supabase).
 * El fetch se realiza una sola vez al montar el provider.
 *
 * Uso:
 *   const { categorias, loading } = useCategorias()
 */
const CategoriasContext = createContext({ categorias: [], loading: true })

export function CategoriasProvider({ children }) {
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    supabase
      .from('categorias')
      .select('id, nombre, icono, color, tipo')
      .order('nombre', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data) setCategorias(data)
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  return (
    <CategoriasContext.Provider value={{ categorias, loading }}>
      {children}
    </CategoriasContext.Provider>
  )
}

/**
 * useCategorias
 * Hook para consumir el contexto de categorías desde cualquier componente.
 *
 * @returns {{ categorias: Array, loading: boolean }}
 */
export function useCategorias() {
  return useContext(CategoriasContext)
}
