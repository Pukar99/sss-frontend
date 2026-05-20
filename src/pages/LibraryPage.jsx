import { useState, useEffect, useCallback, useMemo } from 'react'
import { getLearningEntries, getProgressLogs } from '../api/index'
import KnowledgeCard from '../components/skill/KnowledgeCard'
import BottomNav from '../components/shared/BottomNav'

const FILTERS = ['All', 'Skill', 'Study']
const SCORES = ['All', 'Strong', 'Needs Review']

function daysSince(dateStr) {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

const scoreColor = {
  strong: 'text-green-400',
  partial: 'text-amber-400',
  weak: 'text-red-400',
}

const typeBadge = {
  skill: 'text-blue-400',
  study: 'text-purple-400',
}

export default function LibraryPage() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [scoreFilter, setScoreFilter] = useState('All')
  const [activeCard, setActiveCard] = useState(null)
  const [cardLogs, setCardLogs] = useState([])

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getLearningEntries({ status: 'done' })
      setEntries(data)
    } catch (_) {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  async function handleViewCard(entry) {
    try {
      const logs = await getProgressLogs(entry.id)
      setCardLogs(logs)
    } catch (_) {
      setCardLogs([])
    }
    setActiveCard(entry)
  }

  const revisionDue = useMemo(() =>
    entries
      .filter(e => {
        const days = daysSince(e.completed_at)
        return days !== null && days >= 7
      })
      .sort((a, b) => daysSince(b.completed_at) - daysSince(a.completed_at))
      .slice(0, 5),
    [entries]
  )

  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (typeFilter !== 'All' && e.type !== typeFilter.toLowerCase()) return false
      if (scoreFilter === 'Strong' && e.assessment_score !== 'strong') return false
      if (scoreFilter === 'Needs Review' && !e.needs_review) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const inTitle = e.title?.toLowerCase().includes(q)
        const inInsight = e.core_insight?.toLowerCase().includes(q)
        if (!inTitle && !inInsight) return false
      }
      return true
    })
  }, [entries, typeFilter, scoreFilter, search])

  if (activeCard) {
    return (
      <div className="min-h-screen bg-gray-900 px-4 py-4 pb-24 max-w-lg mx-auto">
        <KnowledgeCard
          entry={activeCard}
          logs={cardLogs}
          onBack={() => setActiveCard(null)}
        />
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-4 pb-24 max-w-lg mx-auto">
      <h1 className="text-base font-semibold text-white mb-4">Library</h1>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search title or insight..."
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 mb-3"
      />

      {/* Type filter chips */}
      <div className="flex gap-2 mb-2">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setTypeFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              typeFilter === f ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
            }`}
          >
            {f === 'Skill' ? '🔵 ' : f === 'Study' ? '🟣 ' : ''}{f}
          </button>
        ))}
      </div>

      {/* Score filter chips */}
      <div className="flex gap-2 mb-5">
        {SCORES.map(s => (
          <button
            key={s}
            onClick={() => setScoreFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              scoreFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Revision due */}
      {revisionDue.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-2">
            Revision Due
          </p>
          <div className="space-y-2">
            {revisionDue.map(e => (
              <div key={e.id} className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm text-white">{e.title}</p>
                  <p className="text-xs text-amber-400 mt-0.5">{daysSince(e.completed_at)} days ago</p>
                </div>
                <button
                  onClick={() => handleViewCard(e)}
                  className="text-xs font-medium text-amber-400 hover:text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg"
                >
                  Revise →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cards list */}
      {loading && <p className="text-xs text-gray-500">Loading...</p>}

      {!loading && filtered.length === 0 && (
        <p className="text-xs text-gray-500">
          {entries.length === 0 ? 'No completed entries yet.' : 'No entries match your filters.'}
        </p>
      )}

      <div className="space-y-2">
        {filtered.map(e => (
          <button
            key={e.id}
            onClick={() => handleViewCard(e)}
            className="w-full text-left bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-xl px-4 py-3 space-y-1 transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-xs font-semibold shrink-0 ${typeBadge[e.type] || 'text-gray-400'}`}>
                  {e.type === 'skill' ? '🔵' : '🟣'}
                </span>
                <p className="text-sm font-medium text-white truncate">{e.title}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {e.needs_review && <span className="text-xs text-amber-400">⚠️</span>}
                {e.assessment_score && (
                  <span className={`text-xs capitalize ${scoreColor[e.assessment_score] || 'text-gray-400'}`}>
                    {e.assessment_score === 'strong' ? 'Strong ✅' : e.assessment_score}
                  </span>
                )}
                <span className="text-gray-600 text-xs">→</span>
              </div>
            </div>
            {e.core_insight && (
              <p className="text-xs text-gray-500 italic truncate">{e.core_insight}</p>
            )}
            {e.completed_at && (
              <p className="text-xs text-gray-600">
                {new Date(e.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </p>
            )}
          </button>
        ))}
      </div>

      <BottomNav />
    </div>
  )
}
