import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { FiAward, FiPieChart } from 'react-icons/fi'
import { getIconComponent } from '../../types/categorias'

export function RankingGastos({ proyectoId, moneda = 'USD' }) {
  const [periodo, setPeriodo] = useState('MES') // 'DIA' | 'SEMANA' | 'MES'
  const [rawTxs, setRawTxs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (!proyectoId) return
      setLoading(true)

      const { data, error } = await supabase
        .from('transacciones')
        .select(`
          monto, tipo, fecha, categoria_id,
          categorias ( id, nombre, icono, color )
        `)
        .eq('proyecto_id', proyectoId)
        .eq('tipo', 'GASTO')
        .order('fecha', { ascending: false })

      if (!error && data) {
        setRawTxs(data)
      }
      setLoading(false)
    }

    fetchData()
  }, [proyectoId])

  const rankingData = useMemo(() => {
    const hoy = new Date()
    const inicio = new Date()
    
    if (periodo === 'DIA') {
      inicio.setHours(0, 0, 0, 0)
    } else if (periodo === 'SEMANA') {
      const diaSemana = hoy.getDay()
      const diff = hoy.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1)
      inicio.setDate(diff)
      inicio.setHours(0, 0, 0, 0)
    } else {
      inicio.setDate(1)
      inicio.setHours(0, 0, 0, 0)
    }

    const filtered = rawTxs.filter(tx => new Date(tx.fecha) >= inicio)
    
    const map = {}
    filtered.forEach(tx => {
      const catId = tx.categoria_id || 'unassigned'
      if (!map[catId]) {
        map[catId] = {
          id: catId,
          nombre: tx.categorias?.nombre || 'Sin Categoría',
          icono: tx.categorias?.icono || '❓',
          color: tx.categorias?.color || '#94a3b8',
          total: 0,
          count: 0
        }
      }
      map[catId].total += Number(tx.monto || 0)
      map[catId].count += 1
    })

    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [rawTxs, periodo])

  const winner = rankingData[0]
  const top5 = rankingData.slice(0, 5)

  const formatMoney = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: moneda }).format(val)

  return (
    <div className="bg-dark-card border border-border-dark rounded-2xl overflow-hidden mt-6 shadow-xl flex flex-col">
      {/* HEADER / SELECTOR */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-dark/60 bg-dark-bg/40">
        <div className="flex items-center gap-2">
          <FiPieChart className="text-accent" />
          <h2 className="text-accent-light font-bold text-xs uppercase tracking-wider">Ranking de Gastos</h2>
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

      <div className="p-4 sm:p-6 relative min-h-[320px]">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-dark-card/60 backdrop-blur-sm">
            <div className="animate-spin h-6 w-6 text-accent border-2 border-accent border-t-transparent rounded-full" />
          </div>
        )}

        {rankingData.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <p className="text-accent-light/30 text-sm">No hay gastos registrados en este periodo.</p>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* WINNER CARD */}
            {winner && (
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-danger/20 to-accent/20 rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-dark-bg/80 border border-border-dark/50 p-4 rounded-xl flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-dark-card border border-border-dark/50 flex items-center justify-center relative shadow-inner"
                         style={{ backgroundColor: winner.color + '15', borderColor: winner.color + '40' }}>
                      {(() => {
                        const Icon = getIconComponent(winner.icono)
                        return <Icon size={22} style={{ color: winner.color }} />
                      })()}
                      <div className="absolute -top-1 -right-1 bg-accent p-1 rounded-full shadow-lg">
                        <FiAward size={10} className="text-dark-card" />
                      </div>
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-accent-light font-black text-lg truncate leading-tight">{winner.nombre}</p>
                      <p className="text-accent-light/40 text-[10px] sm:text-xs">
                        Has realizado {winner.count} {winner.count === 1 ? 'transacción' : 'transacciones'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-2 shrink-0">
                    <p className="text-danger font-black text-xl sm:text-2xl drop-shadow-[0_0_8px_rgba(239,68,68,0.2)]">
                      {formatMoney(winner.total)}
                    </p>
                    <p className="text-[10px] text-accent-light/30 uppercase font-black">Top Gasto</p>
                  </div>
                </div>
              </div>
            )}

            {/* TOP 3 LIST */}
            <div className="space-y-3 pt-2">
              <p className="text-accent-light/40 text-[10px] font-black uppercase tracking-widest pl-1">Ranking categorías</p>
              {top5.map((cat, idx) => (
                <div key={cat.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <span className="text-accent-light/30 font-black text-xs italic w-4">#{idx + 1}</span>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                         style={{ backgroundColor: cat.color + '15', border: `1px solid ${cat.color}40` }}>
                      {(() => {
                        const Icon = getIconComponent(cat.icono)
                        return <Icon size={14} style={{ color: cat.color }} />
                      })()}
                    </div>
                    <span className="text-accent-light/70 text-sm font-semibold group-hover:text-accent transition-colors truncate max-w-[100px]">{cat.nombre}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-1.5 w-16 sm:w-24 bg-dark-bg rounded-full overflow-hidden border border-border-dark/30 hidden xs:block">
                       <div 
                         className="h-full bg-danger/40 transition-all duration-700 ease-out" 
                         style={{ width: `${(cat.total / winner.total) * 100}%` }}
                       ></div>
                    </div>
                    <p className="text-accent-light font-bold text-xs min-w-[70px] text-right">
                      {formatMoney(cat.total)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
