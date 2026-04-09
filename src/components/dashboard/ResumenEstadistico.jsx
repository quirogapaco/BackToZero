import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { FiBarChart2 } from 'react-icons/fi'

export function ResumenEstadistico({ proyectoId, moneda = 'USD' }) {
  const [periodo, setPeriodo] = useState('MES')
  const [rawTxs, setRawTxs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (!proyectoId) return
      setLoading(true)
      const { data, error } = await supabase
        .from('transacciones')
        .select('monto, tipo, fecha')
        .eq('proyecto_id', proyectoId)
        .order('fecha', { ascending: false })
      if (!error && data) setRawTxs(data)
      setLoading(false)
    }
    fetchData()
  }, [proyectoId])

  const stats = useMemo(() => {
    const inicio = new Date()
    if (periodo === 'DIA') {
      inicio.setHours(0, 0, 0, 0)
    } else if (periodo === 'SEMANA') {
      const dia = inicio.getDay()
      inicio.setDate(inicio.getDate() - dia + (dia === 0 ? -6 : 1))
      inicio.setHours(0, 0, 0, 0)
    } else {
      inicio.setDate(1)
      inicio.setHours(0, 0, 0, 0)
    }

    const filtered = rawTxs.filter(tx => new Date(tx.fecha) >= inicio)
    let ing = 0, gas = 0, ingC = 0, gasC = 0
    filtered.forEach(tx => {
      if (tx.tipo === 'INGRESO') { ing += Number(tx.monto || 0); ingC++ }
      else { gas += Number(tx.monto || 0); gasC++ }
    })
    return { ing, gas, ingC, gasC, balance: ing - gas }
  }, [rawTxs, periodo])

  const fmt = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: moneda }).format(val)

  return (
    <div className="bg-dark-card border border-border-dark rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-dark/60 bg-dark-bg/40">
        <div className="flex items-center gap-2">
          <FiBarChart2 className="text-accent" />
          <h2 className="text-accent-light font-bold text-xs uppercase tracking-wider">Resumen Estadístico</h2>
        </div>
        <div className="flex bg-dark-bg p-1 rounded-full border border-border-dark/50">
          {['DIA', 'SEMANA', 'MES'].map(p => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all duration-200 capitalize
                ${periodo === p ? 'bg-dark-card text-accent shadow-md' : 'text-accent-light/40 hover:text-accent-light'}
              `}
            >
              {p.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6 relative min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-dark-card/60 backdrop-blur-sm">
            <div className="animate-spin h-6 w-6 text-accent border-2 border-accent border-t-transparent rounded-full" />
          </div>
        )}

        <div className="flex flex-col h-full gap-6">
          {/* Grid 2 cols */}
          <div className="grid grid-cols-2 gap-3 pb-5 border-b border-border-dark/50 border-dashed">
            <div className="bg-dark-bg p-3 rounded-xl flex flex-col items-center text-center border border-border-dark/30 overflow-hidden">
              <span className="text-accent/40 text-[10px] font-bold uppercase tracking-widest mb-1">Ingresos</span>
              <span className="text-base sm:text-xl font-black text-accent truncate w-full break-all leading-tight">
                {fmt(stats.ing)}
              </span>
              <span className="text-accent-light/30 text-[10px] mt-1">{stats.ingC} transacciones</span>
            </div>
            <div className="bg-dark-bg p-3 rounded-xl flex flex-col items-center text-center border border-border-dark/30 overflow-hidden">
              <span className="text-danger/40 text-[10px] font-bold uppercase tracking-widest mb-1">Gastos</span>
              <span className="text-base sm:text-xl font-black text-danger truncate w-full break-all leading-tight">
                {fmt(stats.gas)}
              </span>
              <span className="text-accent-light/30 text-[10px] mt-1">{stats.gasC} transacciones</span>
            </div>
          </div>

          {/* Balance Neto */}
          <div className="flex flex-col items-center justify-center mt-2">
            <p className="text-accent-light/30 text-[10px] font-black uppercase tracking-widest mb-3">Balance Neto</p>
            <div className={`w-full max-w-[85%] px-4 py-4 rounded-2xl bg-dark-bg/60 border border-border-dark/50 flex items-center justify-center shadow-lg
                ${stats.balance >= 0 ? 'shadow-accent/5' : 'shadow-danger/5'}
            `}>
              <p className={`text-2xl sm:text-4xl font-black break-all text-center leading-tight
                ${stats.balance >= 0 ? 'text-accent drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'text-danger drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]'}
              `}>
                {stats.balance < 0 ? '-' : '+' }{fmt(Math.abs(stats.balance))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
