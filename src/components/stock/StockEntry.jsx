import { useState, useEffect, useCallback } from 'react'
import { getRecentStockEntries } from '../../api/index'
import TradeJournal from './TradeJournal'
import ResearchEntry from './ResearchEntry'

const resultColor = { win: 'text-green-400', loss: 'text-red-400', open: 'text-amber-400' }
const confidenceColor = { high: 'text-green-400', medium: 'text-amber-400', low: 'text-red-400' }

export default function StockEntry({ onSaved }) {
  const [view, setView] = useState('list') // 'list' | 'trade' | 'research' | 'detail'
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getRecentStockEntries(30)
      setEntries(data)
    } catch (_) {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  function handleSaved() {
    fetchEntries()
    onSaved()
  }

  if (view === 'trade') return <TradeJournal onSaved={handleSaved} onBack={() => setView('list')} />
  if (view === 'research') return <ResearchEntry onSaved={handleSaved} onBack={() => setView('list')} />

  return (
    <div className="space-y-5">
      {/* New log buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setView('trade')}
          className="flex-1 flex items-center gap-3 bg-gray-800/60 hover:bg-gray-800 border border-gray-700 hover:border-amber-500/30 rounded-2xl px-4 py-3.5 transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <span className="text-sm">📈</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Trade Journal</p>
            <p className="text-xs text-gray-500">Log a trade taken</p>
          </div>
        </button>
        <button
          onClick={() => setView('research')}
          className="flex-1 flex items-center gap-3 bg-gray-800/60 hover:bg-gray-800 border border-gray-700 hover:border-amber-500/30 rounded-2xl px-4 py-3.5 transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <span className="text-sm">🔍</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Research</p>
            <p className="text-xs text-gray-500">Analysis / Backtest</p>
          </div>
        </button>
      </div>

      {/* History */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Recent</p>

        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-800/40 rounded-2xl animate-pulse" />)}
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600 text-sm">No stock entries yet.</p>
            <p className="text-gray-700 text-xs mt-1">Log a trade or research above.</p>
          </div>
        )}

        {!loading && entries.length > 0 && (
          <div className="space-y-2">
            {entries.map(entry => {
              const isTrade = entry.entry_type === 'trade'
              const trade = (entry.trades || [])[0]
              const research = (entry.research_entries || [])[0]
              const isExpanded = expanded === entry.id

              return (
                <div key={entry.id} className="bg-gray-800/60 border border-gray-700 rounded-2xl overflow-hidden">
                  {/* Row header */}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : entry.id)}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <div className="min-w-0">
                        {isTrade && trade && (
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-white">{trade.symbol}</p>
                            <span className="text-xs text-gray-500 capitalize">{trade.direction}</span>
                            {trade.result && (
                              <span className={`text-xs font-medium capitalize ${resultColor[trade.result] || 'text-gray-400'}`}>
                                {trade.result}
                              </span>
                            )}
                            {trade.pnl != null && (
                              <span className={`text-xs font-medium ${parseFloat(trade.pnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {parseFloat(trade.pnl) >= 0 ? '+' : ''}{parseFloat(trade.pnl)}
                              </span>
                            )}
                          </div>
                        )}
                        {!isTrade && research && (
                          <p className="text-sm font-semibold text-white truncate">{research.topic}</p>
                        )}
                        <p className="text-xs text-gray-600 mt-0.5">{entry.date} · {isTrade ? 'Trade' : 'Research'}</p>
                      </div>
                    </div>
                    <span className="text-gray-600 text-xs ml-2">{isExpanded ? '▲' : '▼'}</span>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-gray-700/50 px-4 py-3 space-y-2">
                      {isTrade && trade && (
                        <>
                          {trade.entry_price && (
                            <div className="flex gap-4 text-xs text-gray-400">
                              <span>Entry <span className="text-white">{parseFloat(trade.entry_price)}</span></span>
                              {trade.exit_price && <span>Exit <span className="text-white">{parseFloat(trade.exit_price)}</span></span>}
                            </div>
                          )}
                          {trade.reason && (
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">Why I took it</p>
                              <p className="text-sm text-gray-300">{trade.reason}</p>
                            </div>
                          )}
                          {trade.what_happened && (
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">What happened</p>
                              <p className="text-sm text-gray-300">{trade.what_happened}</p>
                            </div>
                          )}
                          {trade.emotion && (
                            <span className="text-xs text-gray-500 capitalize">Emotion: <span className="text-gray-400">{trade.emotion}</span></span>
                          )}
                          {trade.screenshot_url && (
                            <img src={trade.screenshot_url} alt="chart" className="w-full rounded-xl border border-gray-700 mt-1" />
                          )}
                        </>
                      )}
                      {!isTrade && research && (
                        <>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500 capitalize">{research.type?.replace('_', ' ')}</span>
                            {research.confidence && (
                              <span className={`capitalize ${confidenceColor[research.confidence] || 'text-gray-400'}`}>
                                {research.confidence} confidence
                              </span>
                            )}
                          </div>
                          {research.what_i_did && (
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">What I did</p>
                              <p className="text-sm text-gray-300">{research.what_i_did}</p>
                            </div>
                          )}
                          {research.finding && (
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">Finding</p>
                              <p className="text-sm text-gray-300">{research.finding}</p>
                            </div>
                          )}
                          {research.image_url && (
                            <img src={research.image_url} alt="chart" className="w-full rounded-xl border border-gray-700 mt-1" />
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
