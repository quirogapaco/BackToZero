import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

export function GraficoEvolucion({ proyectoId, moneda = 'USD' }) {
  const [activeTab, setActiveTab] = useState('GRAFICO') // 'GRAFICO' | 'RESUMEN'
  
  // Scopes de tiempo
  const [graficoDias, setGraficoDias] = useState(30)
  const [resumenPeriodo, setResumenPeriodo] = useState('MES') // 'DIA' | 'SEMANA' | 'MES'

  const [rawTxs, setRawTxs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (!proyectoId) return
      setLoading(true)

      // Traer todas las transacciones del proyecto para que los filtros de Resumen tengan toda la data
      const { data: txs, error } = await supabase
        .from('transacciones')
        .select('monto, tipo, fecha')
        .eq('proyecto_id', proyectoId)
        .order('fecha', { ascending: false })

      if (!error && txs) {
        setRawTxs(txs)
      }
      setLoading(false)
    }

    fetchData()
  }, [proyectoId])

  // ================= DATA GRÁFICO =================
  const chartData = useMemo(() => {
    const grouped = {}
    const hoy = new Date()

    if (graficoDias === 1) {
      // Para "Hoy", agrupar por bloques de 3 horas
      hoy.setHours(0, 0, 0, 0)
      for (let i = 0; i < 24; i += 3) {
        const d = new Date(hoy)
        d.setHours(i, 0, 0, 0)
        const label = `${String(i).padStart(2, '0')}:00`
        grouped[label] = { fecha: label, ingresos: 0, gastos: 0, origDate: d }
      }

      rawTxs.forEach(tx => {
        const txDate = new Date(tx.fecha)
        if (txDate >= hoy) {
          const snapH = Math.floor(txDate.getHours() / 3) * 3
          const label = `${String(snapH).padStart(2, '0')}:00`
          if (grouped[label]) {
            if (tx.tipo === 'INGRESO') {
              grouped[label].ingresos += Number(tx.monto || 0)
            } else {
              grouped[label].gastos += Number(tx.monto || 0)
            }
          }
        }
      })
      return Object.values(grouped).sort((a, b) => a.origDate - b.origDate)
    }

    // Para 7 o 30 días, agrupar por día
    hoy.setHours(23, 59, 59, 999)
    const inicio = new Date()
    inicio.setDate(hoy.getDate() - graficoDias + 1)
    inicio.setHours(0, 0, 0, 0)

    for (let i = 0; i < graficoDias; i++) {
      const d = new Date(inicio)
      d.setDate(d.getDate() + i)
      const label = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short' }).format(d)
      grouped[label] = { fecha: label, ingresos: 0, gastos: 0, origDate: d }
    }

    rawTxs.forEach(tx => {
      const txDate = new Date(tx.fecha)
      if (txDate >= inicio) {
        const label = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short' }).format(txDate)
        if (grouped[label]) {
          if (tx.tipo === 'INGRESO') {
            grouped[label].ingresos += Number(tx.monto || 0)
          } else {
            grouped[label].gastos += Number(tx.monto || 0)
          }
        }
      }
    })

    return Object.values(grouped).sort((a, b) => a.origDate - b.origDate)
  }, [rawTxs, graficoDias])

  // ================= DATA RESUMEN =================
  const resumenStats = useMemo(() => {
    const inicio = new Date()
    
    if (resumenPeriodo === 'DIA') {
      // Hoy desde las 00:00
      inicio.setHours(0, 0, 0, 0)
    } else if (resumenPeriodo === 'SEMANA') {
      // Inicio de la semana (Lunes)
      const diaSemana = inicio.getDay() // 0 = Domingo, 1 = Lunes...
      const diff = inicio.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1) // Ajusta si es domingo
      inicio.setDate(diff)
      inicio.setHours(0, 0, 0, 0)
    } else {
      // Inicio de este mes (día 1)
      inicio.setDate(1)
      inicio.setHours(0, 0, 0, 0)
    }

    const filtered = rawTxs.filter(tx => new Date(tx.fecha) >= inicio)

    let ingresosTotal = 0
    let gastosTotal = 0
    let ingresosCount = 0
    let gastosCount = 0

    filtered.forEach(tx => {
      if (tx.tipo === 'INGRESO') {
        ingresosTotal += Number(tx.monto || 0)
        ingresosCount++
      } else {
        gastosTotal += Number(tx.monto || 0)
        gastosCount++
      }
    })

    return {
      ingresosTotal, ingresosCount,
      gastosTotal, gastosCount,
      balance: ingresosTotal - gastosTotal
    }
  }, [rawTxs, resumenPeriodo])

  const formatMoney = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: moneda }).format(val)

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-card border border-accent/40 rounded-lg p-3 shadow-lg">
          <p className="text-accent-light font-bold text-sm mb-2">{label}</p>
          {payload.map((p, i) => (
            <div key={i} className="flex justify-between gap-4 text-xs">
              <span style={{ color: p.color }}>{p.name}:</span>
              <span className="font-bold text-accent-light">
                {formatMoney(p.value)}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-dark-card border border-border-dark rounded-2xl overflow-hidden mt-4 sm:mt-6 shadow-xl">
      
      {/* TABS HEADER CON FLECHAS */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-dark/60 bg-dark-bg/50">
        <button 
          onClick={() => setActiveTab(activeTab === 'GRAFICO' ? 'RESUMEN' : 'GRAFICO')}
          className="p-1.5 text-accent-light/50 hover:text-accent hover:bg-dark-surface rounded-full transition-colors"
        >
          <FiChevronLeft size={20} />
        </button>
        <span className="text-sm font-bold text-accent tracking-wide uppercase">
          {activeTab === 'GRAFICO' ? 'Gráfico de Mvto.' : 'Resumen Stats'}
        </span>
        <button 
          onClick={() => setActiveTab(activeTab === 'GRAFICO' ? 'RESUMEN' : 'GRAFICO')}
          className="p-1.5 text-accent-light/50 hover:text-accent hover:bg-dark-surface rounded-full transition-colors"
        >
          <FiChevronRight size={20} />
        </button>
      </div>

      <div className="p-4 sm:p-6 relative min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-dark-card/60 backdrop-blur-sm">
            <div className="animate-spin h-6 w-6 text-accent border-2 border-accent border-t-transparent rounded-full" />
          </div>
        )}

        {/* CONTENIDO TABS */}
        {activeTab === 'GRAFICO' && (
          <div className="animate-fade-in">
            <div className="flex justify-end mb-4">
              <div className="flex bg-dark-bg p-1 rounded-lg border border-border-dark/50">
                <button
                  onClick={() => setGraficoDias(1)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${graficoDias === 1 ? 'bg-dark-card text-accent shadow-sm' : 'text-accent-light/40 hover:text-accent-light'}`}
                >
                  Hoy
                </button>
                <button
                  onClick={() => setGraficoDias(7)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${graficoDias === 7 ? 'bg-dark-card text-accent shadow-sm' : 'text-accent-light/40 hover:text-accent-light'}`}
                >
                  7 Días
                </button>
                <button
                  onClick={() => setGraficoDias(30)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${graficoDias === 30 ? 'bg-dark-card text-accent shadow-sm' : 'text-accent-light/40 hover:text-accent-light'}`}
                >
                  30 Días
                </button>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="fecha" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                    minTickGap={20}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} 
                    tickFormatter={(val) => val === 0 ? '' : `$${val >= 1000 ? (val/1000).toFixed(0)+'k' : val}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" name="Ingresos" dataKey="ingresos" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorIngresos)" />
                  <Area type="monotone" name="Gastos" dataKey="gastos" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorGastos)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'RESUMEN' && (
          <div className="animate-fade-in flex flex-col h-full">
            {/* Filtros de Tiempo Resumen */}
            <div className="flex justify-center mb-8">
              <div className="flex bg-dark-bg p-1 rounded-full border border-border-dark/50">
                {['DIA', 'SEMANA', 'MES'].map(periodo => (
                  <button
                    key={periodo}
                    onClick={() => setResumenPeriodo(periodo)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-200 capitalize
                      ${resumenPeriodo === periodo ? 'bg-dark-card text-accent shadow-md' : 'text-accent-light/40 hover:text-accent-light'}
                    `}
                  >
                    {periodo.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid Estadísticas */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 pb-6 border-b border-border-dark/60 border-dashed">
              <div className="bg-dark-bg p-3 sm:p-4 rounded-xl flex flex-col items-center justify-center text-center border border-border-dark/30 overflow-hidden w-full">
                <span className="text-accent/30 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1 shadow-accent drop-shadow-md">Ingresos</span>
                <span className="text-lg sm:text-2xl xl:text-3xl font-black text-accent truncate w-full break-all leading-tight">
                  {formatMoney(resumenStats.ingresosTotal)}
                </span>
                <span className="text-accent-light/40 text-[10px] sm:text-xs mt-1">{resumenStats.ingresosCount} txs</span>
              </div>
              <div className="bg-dark-bg p-3 sm:p-4 rounded-xl flex flex-col items-center justify-center text-center border border-border-dark/30 overflow-hidden w-full">
                <span className="text-danger/40 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1 shadow-danger drop-shadow-md">Gastos</span>
                <span className="text-lg sm:text-2xl xl:text-3xl font-black text-danger truncate w-full break-all leading-tight">
                  {formatMoney(resumenStats.gastosTotal)}
                </span>
                <span className="text-accent-light/40 text-[10px] sm:text-xs mt-1">{resumenStats.gastosCount} txs</span>
              </div>
            </div>

            {/* Gran Total (Balance Neto) */}
            <div className="mt-8 flex flex-col items-center justify-center mb-2 w-full">
              <p className="text-accent-light/40 text-xs mb-1 uppercase tracking-widest font-bold">Balance Neto</p>
              <div className={`px-4 sm:px-8 py-3 rounded-2xl bg-dark-bg/50 border border-border-dark/50 flex items-center justify-center shadow-lg w-full max-w-[90%]
                  ${resumenStats.balance >= 0 ? 'shadow-accent/5' : 'shadow-danger/5'}
              `}>
                <p className={`text-2xl sm:text-4xl md:text-5xl font-black truncate w-full text-center break-all leading-tight
                  ${resumenStats.balance >= 0 ? 'text-accent drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'text-danger drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]'}
                `}>
                  {resumenStats.balance < 0 ? '-' : ''}{formatMoney(Math.abs(resumenStats.balance))}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
