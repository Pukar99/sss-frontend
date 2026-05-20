import { useState } from 'react'
import TradeJournal from './TradeJournal'
import ResearchEntry from './ResearchEntry'

export default function StockEntry({ onSaved }) {
  const [view, setView] = useState('chooser') // 'chooser' | 'trade' | 'research'

  if (view === 'trade') return <TradeJournal onSaved={onSaved} onBack={() => setView('chooser')} />
  if (view === 'research') return <ResearchEntry onSaved={onSaved} onBack={() => setView('chooser')} />

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
        What would you like to log?
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => setView('trade')}
          className="flex-1 flex flex-col items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl py-5 text-sm font-medium text-white"
        >
          <span className="text-2xl">📈</span>
          Trade Journal
        </button>
        <button
          onClick={() => setView('research')}
          className="flex-1 flex flex-col items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl py-5 text-sm font-medium text-white"
        >
          <span className="text-2xl">🔍</span>
          Research / Backtest
        </button>
      </div>
    </div>
  )
}
