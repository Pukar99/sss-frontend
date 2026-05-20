import { useState, useEffect, useCallback, useMemo } from 'react'
import { getWeeklyData, aiWeekly } from '../api/index'
import BottomNav from '../components/shared/BottomNav'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const BLOCKS = ['stock', 'skill', 'study']
const BLOCK_LABELS = { stock: '🟡 Stock', skill: '🔵 Skill', study: '🟣 Study' }
const BLOCK_COLORS = { stock: 'text-amber-400', skill: 'text-blue-400', study: 'text-purple-400' }

function getMondayOf(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1 - day)
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function toDateStr(date) {
  return date.toISOString().slice(0, 10)
}

function formatWeekLabel(monday) {
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)
  const opts = { day: 'numeric', month: 'short' }
  return `${monday.toLocaleDateString('en-GB', opts)} – ${sunday.toLocaleDateString('en-GB', opts)}`
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
    setLoading(true)
    setWeekData(null)
    setSummary(null)
    try {
      const data = await getWeeklyData(startDate)
      setWeekData(data)
    } catch (_) {
      setWeekData({ stock: [], learning: [], alignment: [] })
    } finally {
      setLoading(false)
    }
  }, [startDate])

  useEffect(() => { fetchWeek() }, [fetchWeek])

  function prevWeek() {
    setMonday(m => { const d = new Date(m); d.setDate(d.getDate() - 7); return d })
  }
  function nextWeek() {
    setMonday(m => { const d = new Date(m); d.setDate(d.getDate() + 7); return d })
  }

  // Build day-keyed maps from weekData
  const dayMap = useMemo(() => {
    if (!weekData) return {}
    const map = {}
    DAYS.forEach((_, i) => {
      const d = new Date(monday)
      d.setDate(d.getDate() + i)
      const key = toDateStr(d)
      map[key] = { stock: false, skill: false, study: false, entries: { stock: [], skill: [], study: [] } }
    })

    weekData.stock.forEach(e => {
      const key = e.date
      if (map[key]) {
        map[key].stock = true
        map[key].entries.stock.push(e)
      }
    })

    weekData.learning.forEach(e => {
      // Use progress_logs dates to mark day logged
      const logs = e.progress_logs || []
      logs.forEach(log => {
        const key = log.date
        if (map[key] && (e.type === 'skill' || e.type === 'study')) {
          map[key][e.type] = true
          if (!map[key].entries[e.type].find(x => x.id === e.id)) {
            map[key].entries[e.type].push(e)
          }
        }
      })
    })

    return map
  }, [weekData, monday])

  const alignmentMap = useMemo(() => {
    if (!weekData) return {}
    const map = {}
    ;(weekData.alignment || []).forEach(a => { map[a.date] = a })
    return map
  }, [weekData])

  async function handleGetSummary() {
    if (!weekData) return
    setSummaryLoading(true)
    setSummaryError('')
    try {
      const result = await aiWeekly({ weekData })
      setSummary(result)
    } catch (err) {
      setSummaryError(err.message)
    } finally {
      setSummaryLoading(false)
    }
  }

  const dayKeys = useMemo(() => DAYS.map((_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return toDateStr(d)
  }), [monday])

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-4 pb-24 max-w-lg mx-auto">
      <h1 className="text-base font-semibold text-white mb-4">Weekly</h1>

      {/* Week nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevWeek} className="text-gray-400 hover:text-white px-2 py-1 text-sm">←</button>
        <p className="text-sm text-gray-300">{formatWeekLabel(monday)}</p>
        <button onClick={nextWeek} className="text-gray-400 hover:text-white px-2 py-1 text-sm">→</button>
      </div>

      {loading && <p className="text-xs text-gray-500 mb-4">Loading...</p>}

      {/* Grid */}
      {!loading && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden mb-4">
          {/* Day headers */}
          <div className="grid grid-cols-8 border-b border-gray-700">
            <div className="py-2" />
            {DAYS.map(d => (
              <div key={d} className="py-2 text-center text-xs text-gray-500">{d}</div>
            ))}
          </div>

          {/* Block rows */}
          {BLOCKS.map(block => (
            <div key={block} className="grid grid-cols-8 border-b border-gray-700 last:border-0">
              <div className={`py-3 pl-3 text-xs font-medium ${BLOCK_COLORS[block]}`}>
                {block === 'stock' ? '🟡' : block === 'skill' ? '🔵' : '🟣'}
              </div>
              {dayKeys.map(key => {
                const logged = dayMap[key]?.[block] || false
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDay(key)}
                    className="py-3 flex items-center justify-center text-sm hover:bg-gray-700 transition-colors"
                  >
                    {logged ? '✅' : <span className="w-3 h-3 rounded-full border border-gray-600 inline-block" />}
                  </button>
                )
              })}
            </div>
          ))}

          {/* Alignment scores row */}
          <div className="grid grid-cols-8 bg-gray-900/50">
            <div className="py-2 pl-3 text-xs text-gray-600">AI</div>
            {dayKeys.map(key => {
              const a = alignmentMap[key]
              return (
                <div key={key} className="py-2 flex items-center justify-center">
                  {a ? (
                    <span className="text-xs text-green-400 font-medium">{a.score}</span>
                  ) : (
                    <span className="text-xs text-gray-700">–</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Day detail modal */}
      {selectedDay && dayMap[selectedDay] && (
        <div className="fixed inset-0 z-40 flex items-end" onClick={() => setSelectedDay(null)}>
          <div
            className="w-full bg-gray-800 border-t border-gray-700 rounded-t-2xl px-4 pt-4 pb-8 max-h-[70vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-white">
                {new Date(selectedDay).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
              </p>
              <button onClick={() => setSelectedDay(null)} className="text-gray-500 hover:text-white text-sm">✕</button>
            </div>

            {BLOCKS.every(b => !(dayMap[selectedDay]?.entries[b]?.length)) ? (
              <p className="text-xs text-gray-500">Nothing logged this day.</p>
            ) : (
              BLOCKS.map(block => {
                const blockEntries = dayMap[selectedDay]?.entries[block] || []
                if (!blockEntries.length) return null
                return (
                  <div key={block} className="mb-4">
                    <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${BLOCK_COLORS[block]}`}>
                      {BLOCK_LABELS[block]}
                    </p>
                    <div className="space-y-2">
                      {blockEntries.map((e, i) => (
                        <div key={i} className="bg-gray-700 rounded-xl px-3 py-2">
                          <p className="text-sm text-white">
                            {e.title || e.symbol || e.topic || '—'}
                          </p>
                          {e.core_insight && (
                            <p className="text-xs text-gray-400 italic mt-0.5">{e.core_insight}</p>
                          )}
                          {e.what_happened && (
                            <p className="text-xs text-gray-400 mt-0.5">{e.what_happened}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })
            )}

            {alignmentMap[selectedDay] && (
              <div className="mt-2 bg-gray-700 rounded-xl px-3 py-2">
                <p className="text-xs font-semibold text-green-400 mb-1">Alignment Score: {alignmentMap[selectedDay].score}/10</p>
                {alignmentMap[selectedDay].feedback && (
                  <p className="text-xs text-gray-400">{alignmentMap[selectedDay].feedback}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Weekly AI Summary */}
      {!loading && (
        <div className="space-y-3">
          {!summary && (
            <button
              onClick={handleGetSummary}
              disabled={summaryLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
            >
              {summaryLoading ? 'Generating summary...' : 'Get Weekly AI Summary →'}
            </button>
          )}

          {summaryError && <p className="text-xs text-red-400">{summaryError}</p>}

          {summary && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Weekly Summary</p>
                <span className="text-sm font-semibold text-green-400">{summary.score}/10</span>
              </div>

              {summary.summary && (
                <p className="text-sm text-gray-300">{summary.summary}</p>
              )}

              {summary.patterns && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Pattern</p>
                  <p className="text-sm text-gray-400 italic">{summary.patterns}</p>
                </div>
              )}

              {(summary.priorities || []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Next Week</p>
                  <div className="space-y-1">
                    {summary.priorities.map((p, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-xs text-blue-400 mt-0.5 shrink-0">{i + 1}.</span>
                        <p className="text-sm text-gray-300">{p}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setSummary(null)}
                className="text-xs text-gray-600 hover:text-gray-400"
              >
                Refresh
              </button>
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  )
}
