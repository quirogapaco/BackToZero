import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { FiTrendingUp } from 'react-icons/fi'

export function GraficoEvolucion({ proyectoId, moneda = 'USD' }) {
  const [graficoDias, setGraficoDias] = useState(30)
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

  const chartData = useMemo(() => {
    const grouped = {}
    const hoy = new Date()

    if (graficoDias === 1) {
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
            grouped[label][tx.tipo === 'INGRESO' ? 'ingresos' : 'gastos'] += Number(tx.monto || 0)
          }
        }
      })
      return Object.values(grouped).sort((a, b) => a.origDate - b.origDate)
    }

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
          grouped[label][tx.tipo === 'INGRESO' ? 'ingresos' : 'gastos'] += Number(tx.monto || 0)
        }
      }
    })

    return Object.values(grouped).sort((a, b) => a.origDate - b.origDate)
  }, [rawTxs, graficoDias])

  const formatMoney = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: moneda }).format(val)

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-card border border-accent/40 rounded-lg p-3 shadow-lg">
          <p className="text-accent-light font-bold text-sm mb-2">{label}</p>
          {payload.map((p, i) => (
            <div key={i} className="flex justify-between gap-4 text-xs">
              <span style={{ color: p.color }}>{p.name}:</span>
              <span className="font-bold text-accent-light">{formatMoney(p.value)}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-dark-card border border-border-dark rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-dark/60 bg-dark-bg/40">
        <div className="flex items-center gap-2">
          <FiTrendingUp className="text-accent" />
          <h2 className="text-accent-light font-bold text-xs uppercase tracking-wider">Evolución de Movimientos</h2>
        </div>
        <div className="flex bg-dark-bg p-1 rounded-lg border border-border-dark/50">
          {[{ label: 'Hoy', val: 1 }, { label: '7d', val: 7 }, { label: '30d', val: 30 }].map(({ label, val }) => (
            <button key={val} onClick={() => setGraficoDias(val)}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors ${graficoDias === val ? 'bg-dark-card text-accent shadow-sm' : 'text-accent-light/40 hover:text-accent-light'}`}
            >
              {label}
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
        <div className="h-64 sm:h-72 w-full">
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
              <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} minTickGap={20} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                tickFormatter={(val) => val === 0 ? '' : `$${val >= 1000 ? (val/1000).toFixed(0)+'k' : val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" name="Ingresos" dataKey="ingresos" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorIngresos)" />
              <Area type="monotone" name="Gastos" dataKey="gastos" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorGastos)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
