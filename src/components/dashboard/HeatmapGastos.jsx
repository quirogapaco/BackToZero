import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { FiActivity, FiChevronLeft, FiChevronRight } from 'react-icons/fi'

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAY_NAMES   = ['L','M','M','J','V','S','D']

export function HeatmapGastos({ proyectoId, moneda = 'USD' }) {
  const hoyReal = new Date()
  const [viewYear,  setViewYear]  = useState(hoyReal.getFullYear())
  const [viewMonth, setViewMonth] = useState(hoyReal.getMonth())
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [tooltip, setTooltip] = useState(null) // { day, amount, tipo }

  useEffect(() => {
    async function fetchData() {
      if (!proyectoId) return
      setLoading(true)
      const inicio = new Date(viewYear, viewMonth, 1)
      const fin    = new Date(viewYear, viewMonth + 1, 0, 23, 59, 59, 999)

      const { data: txs, error } = await supabase
        .from('transacciones')
        .select('monto, tipo, fecha')
        .eq('proyecto_id', proyectoId)
        .gte('fecha', inicio.toISOString())
        .lte('fecha', fin.toISOString())

      if (!error && txs) setData(txs)
      setLoading(false)
    }
    fetchData()
  }, [proyectoId, viewYear, viewMonth])

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
    setTooltip(null)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
    setTooltip(null)
  }

  const { days, maxGasto, maxIngreso } = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const gastos  = {}
    const ingresos = {}

    data.forEach(tx => {
      const d = new Date(tx.fecha).getDate()
      if (tx.tipo === 'GASTO')   gastos[d]   = (gastos[d]   || 0) + Number(tx.monto || 0)
      else                       ingresos[d] = (ingresos[d] || 0) + Number(tx.monto || 0)
    })

    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1
      return {
        day: d,
        gasto:   gastos[d]   || 0,
        ingreso: ingresos[d] || 0,
        isToday: d === hoyReal.getDate() && viewMonth === hoyReal.getMonth() && viewYear === hoyReal.getFullYear(),
      }
    })

    const maxGasto   = Math.max(...days.map(d => d.gasto),   0)
    const maxIngreso = Math.max(...days.map(d => d.ingreso), 0)

    return { days, maxGasto, maxIngreso }
  }, [data, viewYear, viewMonth])

  const getCellStyle = ({ gasto, ingreso }) => {
    const hasGasto   = gasto   > 0
    const hasIngreso = ingreso > 0

    if (!hasGasto && !hasIngreso) {
      return { background: 'rgba(255,255,255,0.04)', boxShadow: 'none' }
    }

    // Both: show dominant one, use gradient for mixed days
    if (hasGasto && hasIngreso) {
      const gastoRatio   = maxGasto   ? (gasto   / maxGasto)   : 0
      const ingresoRatio = maxIngreso ? (ingreso / maxIngreso) : 0
      return {
        background: `linear-gradient(135deg, rgba(248,113,113,${(0.2 + gastoRatio * 0.7).toFixed(2)}) 50%, rgba(34,197,94,${(0.2 + ingresoRatio * 0.7).toFixed(2)}) 50%)`,
        boxShadow: 'none',
      }
    }

    if (hasGasto) {
      const ratio = maxGasto ? gasto / maxGasto : 0
      const opacity = 0.12 + ratio * 0.88
      const isHigh = ratio >= 0.6
      return {
        background: `rgba(248,113,113,${opacity.toFixed(2)})`,
        boxShadow:  isHigh ? '0 0 8px rgba(248,113,113,0.5)' : 'none',
      }
    }

    // hasIngreso only
    const ratio = maxIngreso ? ingreso / maxIngreso : 0
    const opacity = 0.12 + ratio * 0.88
    const isHigh = ratio >= 0.6
    return {
      background: `rgba(34,197,94,${opacity.toFixed(2)})`,
      boxShadow:  isHigh ? '0 0 8px rgba(34,197,94,0.4)' : 'none',
    }
  }

  const firstWeekday = (() => {
    const d = new Date(viewYear, viewMonth, 1).getDay()
    return d === 0 ? 6 : d - 1
  })()

  const fmt = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: moneda, maximumFractionDigits: 0 }).format(val)

  const handleDayClick = (dayObj) => {
    if (tooltip?.day === dayObj.day) { setTooltip(null); return }
    if (!dayObj.gasto && !dayObj.ingreso) { setTooltip(null); return }
    setTooltip(dayObj)
  }

  return (
    <div className="bg-dark-card border border-border-dark rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-dark/60 bg-dark-bg/40">
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1 text-accent-light/30 hover:text-accent transition-colors rounded"><FiChevronLeft size={14} /></button>
          <div className="flex items-center gap-1.5">
            <FiActivity className="text-danger" size={13} />
            <h2 className="text-accent-light font-bold text-xs uppercase tracking-wider">
              {MONTH_NAMES[viewMonth]} {viewYear !== hoyReal.getFullYear() ? viewYear : ''}
            </h2>
          </div>
          <button onClick={nextMonth} className="p-1 text-accent-light/30 hover:text-accent transition-colors rounded"><FiChevronRight size={14} /></button>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-2 text-[9px] text-accent-light/25">
          <span className="hidden sm:inline">Gasto</span>
          {[0.12, 0.35, 0.6, 0.9].map((o, i) => <div key={i} className="w-3 h-3 rounded-sm" style={{ background: `rgba(248,113,113,${o})` }} />)}
          <span className="mx-0.5">|</span>
          {[0.12, 0.35, 0.6, 0.9].map((o, i) => <div key={i} className="w-3 h-3 rounded-sm" style={{ background: `rgba(34,197,94,${o})` }} />)}
          <span className="hidden sm:inline">Ingreso</span>
        </div>
      </div>

      <div className="p-4 sm:p-5 relative min-h-[260px]">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-dark-card/60 backdrop-blur-sm">
            <div className="animate-spin h-6 w-6 text-danger border-2 border-danger border-t-transparent rounded-full" />
          </div>
        )}

        {/* Tooltip (click) */}
        {tooltip && (
          <div className="mb-3 px-3 py-2 bg-dark-bg border border-border-dark/60 rounded-xl flex items-center justify-between text-xs animate-fade-in">
            <span className="text-accent-light/50 font-medium">{tooltip.day} de {MONTH_NAMES[viewMonth]}</span>
            <div className="flex gap-3">
              {tooltip.ingreso > 0 && <span className="text-accent font-bold">+{fmt(tooltip.ingreso)}</span>}
              {tooltip.gasto   > 0 && <span className="text-danger font-bold">-{fmt(tooltip.gasto)}</span>}
            </div>
          </div>
        )}

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_NAMES.map((d, i) => (
            <div key={i} className="text-center text-[9px] text-accent-light/20 font-bold">{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstWeekday }).map((_, i) => <div key={`e-${i}`} />)}

          {days.map((dayObj) => {
            const style = getCellStyle(dayObj)
            const isSelected = tooltip?.day === dayObj.day
            return (
              <div
                key={dayObj.day}
                onClick={() => handleDayClick(dayObj)}
                className={`relative aspect-square rounded-md flex items-center justify-center cursor-pointer select-none
                  transition-transform active:scale-90 hover:scale-110
                  ${isSelected ? 'ring-1 ring-accent ring-offset-1 ring-offset-dark-card' : ''}
                `}
                style={style}
              >
                <span className={`text-[8px] font-bold leading-none ${dayObj.gasto || dayObj.ingreso ? 'text-white/70' : 'text-white/15'} ${dayObj.isToday ? '!text-white font-black' : ''}`}>
                  {dayObj.day}
                </span>
                {dayObj.isToday && (
                  <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-accent" />
                )}
              </div>
            )
          })}
        </div>

        {/* Summary row */}
        <div className="mt-3 pt-3 border-t border-border-dark/30 flex justify-between text-[10px]">
          <span className="text-accent-light/30">Máx gasto: <span className="text-danger font-bold">{maxGasto > 0 ? fmt(maxGasto) : '—'}</span></span>
          <span className="text-accent-light/30">Máx ingreso: <span className="text-accent font-bold">{maxIngreso > 0 ? fmt(maxIngreso) : '—'}</span></span>
        </div>
      </div>
    </div>
  )
}
