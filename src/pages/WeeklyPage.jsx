import { useState, useEffect, useCallback, useMemo } from 'react'
import { getWeeklyData, aiWeekly } from '../api/index'
import BottomNav from '../components/shared/BottomNav'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const BLOCKS = ['stock', 'skill', 'study']

const BLOCK_CONFIG = {
  stock: { label: 'Stock', short: 'S', color: 'text-amber-400', filled: 'bg-amber-400', empty: 'bg-surface2', border: 'border-amber-500/20' },
  skill: { label: 'Skill', short: 'K', color: 'text-blue-400', filled: 'bg-blue-500', empty: 'bg-surface2', border: 'border-blue-500/20' },
  study: { label: 'Study', short: 'R', color: 'text-purple-400', filled: 'bg-purple-500', empty: 'bg-surface2', border: 'border-purple-500/20' },
}

function getMondayOf(date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  d.setHours(0, 0, 0, 0)
  return d
}

function toDateStr(date) { return date.toISOString().slice(0, 10) }

function formatWeekLabel(monday) {
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)
  const opts = { day: 'numeric', month: 'short' }
  return `${monday.toLocaleDateString('en-GB', opts)} – ${sunday.toLocaleDateString('en-GB', opts)}`
}

function isThisWeek(monday) {
  return toDateStr(getMondayOf(new Date())) === toDateStr(monday)
}

export default function WeeklyPage() {
  const [monday, setMonday] = useState(() => getMondayOf(new Date()))
  const [weekData, setWeekData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(null)
  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState('')

  const startDate = useMemo(() => toDateStr(monday), [monday])

  const fetchWeek = useCallback(async () => {
    setLoading(true); setWeekData(null); setSummary(null)
    try { setWeekData(await getWeeklyData(startDate)) }
    catch (_) { setWeekData({ stock: [], learning: [], alignment: [] }) }
    finally { setLoading(false) }
  }, [startDate])

  useEffect(() => { fetchWeek() }, [fetchWeek])

  const dayKeys = useMemo(() => DAYS.map((_, i) => {
    const d = new Date(monday); d.setDate(d.getDate() + i); return toDateStr(d)
  }), [monday])

  const dayMap = useMemo(() => {
    if (!weekData) return {}
    const map = {}
    dayKeys.forEach(key => {
      map[key] = { stock: false, skill: false, study: false, entries: { stock: [], skill: [], study: [] } }
    })
    weekData.stock?.forEach(e => {
      if (map[e.date]) { map[e.date].stock = true; map[e.date].entries.stock.push(e) }
    })
    weekData.learning?.forEach(e => {
      (e.progress_logs || []).forEach(log => {
        if (map[log.date] && (e.type === 'skill' || e.type === 'study')) {
          map[log.date][e.type] = true
          if (!map[log.date].entries[e.type].find(x => x.id === e.id)) map[log.date].entries[e.type].push(e)
        }
      })
    })
    return map
  }, [weekData, dayKeys])

  const alignmentMap = useMemo(() => {
    const map = {}
    ;(weekData?.alignment || []).forEach(a => { map[a.date] = a })
    return map
  }, [weekData])

  const totalLogged = useMemo(() =>
    dayKeys.reduce((acc, key) => acc + BLOCKS.filter(b => dayMap[key]?.[b]).length, 0),
    [dayKeys, dayMap]
  )

  async function handleGetSummary() {
    setSummaryLoading(true); setSummaryError('')
    try { setSummary(await aiWeekly({ weekData })) }
    catch (err) { setSummaryError(err.message) }
    finally { setSummaryLoading(false) }
  }

  return (
    <div className="min-h-screen px-4 pb-24 max-w-lg mx-auto animate-fade-in">

      {/* Header */}
      <div className="pt-10 pb-5">
        <p className="text-xs text-gray-600 uppercase tracking-widest mb-1">Execution Log</p>
        <h1 className="text-2xl font-bold text-white tracking-tight">Weekly</h1>
      </div>

      {/* Week nav */}
      <div className="flex items-center justify-between mb-5 bg-surface border border-border rounded-2xl px-4 py-3">
        <button onClick={() => setMonday(m => { const d = new Date(m); d.setDate(d.getDate() - 7); return d })}
          className="text-gray-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface2 transition-colors">←</button>
        <div className="text-center">
          <p className="text-sm font-semibold text-white">{formatWeekLabel(monday)}</p>
          {isThisWeek(monday) && <p className="text-xs text-gray-600 mt-0.5">This week</p>}
        </div>
        <button onClick={() => setMonday(m => { const d = new Date(m); d.setDate(d.getDate() + 7); return d })}
          className="text-gray-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface2 transition-colors">→</button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-12 skeleton" />)}
        </div>
      )}

      {/* Heatmap grid */}
      {!loading && (
        <>
          {/* Stats */}
          <div className="flex items-center gap-4 mb-4 px-1">
            <div>
              <p className="text-xl font-bold text-white font-mono">{totalLogged}</p>
              <p className="text-xs text-gray-600">blocks logged</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <p className="text-xl font-bold text-white font-mono">{Math.round((totalLogged / 21) * 100)}%</p>
              <p className="text-xs text-gray-600">completion</p>
            </div>
            {Object.values(alignmentMap).length > 0 && (
              <>
                <div className="w-px h-8 bg-border" />
                <div>
                  <p className="text-xl font-bold text-white font-mono">
                    {Math.round(Object.values(alignmentMap).reduce((s, a) => s + a.score, 0) / Object.values(alignmentMap).length * 10) / 10}
                  </p>
                  <p className="text-xs text-gray-600">avg alignment</p>
                </div>
              </>
            )}
          </div>

          {/* Grid */}
          <div className="bg-surface border border-border rounded-2xl overflow-hidden mb-4">
            {/* Day headers */}
            <div className="grid grid-cols-8 border-b border-border">
              <div className="py-3 px-3" />
              {DAYS.map((d, i) => {
                const key = dayKeys[i]
                const isToday = key === toDateStr(new Date())
                return (
                  <div key={d} className="py-3 text-center">
                    <p className={`text-xs font-medium ${isToday ? 'text-white' : 'text-gray-600'}`}>{d}</p>
                    <p className={`text-xs font-mono mt-0.5 ${isToday ? 'text-gray-400' : 'text-gray-700'}`}>
                      {new Date(key).getDate()}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Block rows */}
            {BLOCKS.map((block, bi) => {
              const cfg = BLOCK_CONFIG[block]
              return (
                <div key={block} className={`grid grid-cols-8 ${bi < BLOCKS.length - 1 ? 'border-b border-border' : ''}`}>
                  <div className={`py-4 px-3 flex items-center`}>
                    <span className={`text-xs font-bold ${cfg.color}`}>{cfg.short}</span>
                  </div>
                  {dayKeys.map(key => {
                    const logged = dayMap[key]?.[block] || false
                    const isToday = key === toDateStr(new Date())
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedDay(key)}
                        className={`py-4 flex items-center justify-center transition-colors ${isToday ? 'bg-surface2' : 'hover:bg-surface2'}`}
                      >
                        <div className={`w-5 h-5 rounded-md transition-all ${
                          logged ? cfg.filled + ' shadow-sm' : 'bg-surface3 opacity-40'
                        }`} />
                      </button>
                    )
                  })}
                </div>
              )
            })}

            {/* Alignment row */}
            <div className="grid grid-cols-8 border-t border-border bg-base/40">
              <div className="py-2.5 px-3">
                <span className="text-xs text-gray-700 font-mono">AI</span>
              </div>
              {dayKeys.map(key => {
                const a = alignmentMap[key]
                return (
                  <div key={key} className="py-2.5 flex items-center justify-center">
                    {a ? (
                      <span className={`text-xs font-bold font-mono ${
                        a.score >= 8 ? 'text-green-400' : a.score >= 6 ? 'text-amber-400' : 'text-red-400'
                      }`}>{a.score}</span>
                    ) : (
                      <span className="text-xs text-gray-800">·</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-1 mb-5">
            {BLOCKS.map(b => {
              const cfg = BLOCK_CONFIG[b]
              return (
                <div key={b} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-sm ${cfg.filled}`} />
                  <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
                </div>
              )
            })}
          </div>

          {/* AI Summary */}
          {!summary ? (
            <button
              onClick={handleGetSummary}
              disabled={summaryLoading}
              className="w-full bg-surface border border-border hover:border-border2 text-gray-400 hover:text-white py-3.5 rounded-2xl text-sm font-semibold transition-all disabled:opacity-50"
            >
              {summaryLoading ? 'Generating intelligence report...' : 'Get Weekly Intelligence Report →'}
            </button>
          ) : (
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-widest">Weekly Report</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xl font-bold font-mono ${
                    summary.score >= 8 ? 'text-green-400' : summary.score >= 6 ? 'text-amber-400' : 'text-red-400'
                  }`}>{summary.score}</span>
                  <span className="text-xs text-gray-700">/10</span>
                </div>
              </div>

              {summary.summary && (
                <p className="text-sm text-gray-300 leading-relaxed">{summary.summary}</p>
              )}

              {summary.patterns && (
                <div className="border-t border-border pt-3">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-widest mb-1.5">Pattern Detected</p>
                  <p className="text-sm text-gray-500 italic">{summary.patterns}</p>
                </div>
              )}

              {(summary.priorities || []).length > 0 && (
                <div className="border-t border-border pt-3">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-widest mb-2.5">Next Week Priorities</p>
                  <div className="space-y-2">
                    {summary.priorities.map((p, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-xs font-bold text-gray-700 mt-0.5 shrink-0 w-4">{i + 1}.</span>
                        <p className="text-sm text-gray-400 leading-snug">{p}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={() => setSummary(null)} className="text-xs text-gray-700 hover:text-gray-500">Regenerate</button>
            </div>
          )}
          {summaryError && <p className="text-xs text-red-400 mt-2">{summaryError}</p>}
        </>
      )}

      {/* Day detail modal */}
      {selectedDay && dayMap[selectedDay] && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-end" onClick={() => setSelectedDay(null)}>
          <div className="w-full max-w-lg mx-auto bg-surface border-t border-border rounded-t-3xl px-4 pt-5 pb-10 max-h-[75vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-base font-bold text-white">
                  {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
                </p>
                {alignmentMap[selectedDay] && (
                  <p className={`text-xs mt-0.5 font-mono ${
                    alignmentMap[selectedDay].score >= 8 ? 'text-green-400' : alignmentMap[selectedDay].score >= 6 ? 'text-amber-400' : 'text-red-400'
                  }`}>Alignment: {alignmentMap[selectedDay].score}/10</p>
                )}
              </div>
              <button onClick={() => setSelectedDay(null)} className="text-gray-600 hover:text-gray-300 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface2">✕</button>
            </div>

            {BLOCKS.every(b => !dayMap[selectedDay]?.entries[b]?.length) ? (
              <p className="text-sm text-gray-700 text-center py-8">Nothing logged this day.</p>
            ) : (
              <div className="space-y-4">
                {BLOCKS.map(block => {
                  const cfg = BLOCK_CONFIG[block]
                  const blockEntries = dayMap[selectedDay]?.entries[block] || []
                  if (!blockEntries.length) return null
                  return (
                    <div key={block}>
                      <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${cfg.color}`}>{cfg.label}</p>
                      <div className="space-y-2">
                        {blockEntries.map((e, i) => (
                          <div key={i} className="bg-surface2 border border-border rounded-2xl px-4 py-3">
                            <p className="text-sm font-medium text-white">
                              {e.title || (e.trades?.[0]?.symbol) || e.topic || '—'}
                            </p>
                            {e.core_insight && <p className={`text-xs italic mt-1 ${cfg.color} opacity-80`}>{e.core_insight}</p>}
                            {e.trades?.[0]?.result && (
                              <p className={`text-xs mt-1 capitalize ${
                                e.trades[0].result === 'win' ? 'text-green-400' : e.trades[0].result === 'loss' ? 'text-red-400' : 'text-amber-400'
                              }`}>{e.trades[0].result}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
                {alignmentMap[selectedDay]?.feedback && (
                  <div className="bg-surface2 border border-border rounded-2xl px-4 py-3">
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-widest mb-1">AI Feedback</p>
                    <p className="text-sm text-gray-400">{alignmentMap[selectedDay].feedback}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
