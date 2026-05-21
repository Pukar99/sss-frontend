import { useState, useEffect, useCallback, useMemo } from 'react'
import { getLearningEntries, getProgressLogs } from '../api/index'
import KnowledgeCard from '../components/skill/KnowledgeCard'
import BottomNav from '../components/shared/BottomNav'

function daysSince(dateStr) {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

const TYPE_CONFIG = {
  skill: { color: 'text-blue-400', bar: 'bg-blue-500', bg: 'bg-blue-500/8', dot: 'bg-blue-400' },
  study: { color: 'text-purple-400', bar: 'bg-purple-500', bg: 'bg-purple-500/8', dot: 'bg-purple-400' },
}

const SCORE_CONFIG = {
  strong: { label: 'Strong', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  partial: { label: 'Partial', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  weak: { label: 'Weak', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
}

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'skill', label: 'Skill' },
  { id: 'study', label: 'Study' },
]

const SCORE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'strong', label: 'Strong' },
  { id: 'review', label: 'Review' },
]

export default function LibraryPage() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [scoreFilter, setScoreFilter] = useState('all')
  const [activeCard, setActiveCard] = useState(null)
  const [cardLogs, setCardLogs] = useState([])

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getLearningEntries({ status: 'done' })
      setEntries(data)
    } catch (_) { setEntries([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  async function handleViewCard(entry) {
    try { setCardLogs(await getProgressLogs(entry.id)) } catch (_) { setCardLogs([]) }
    setActiveCard(entry)
  }

  const revisionDue = useMemo(() =>
    entries
      .filter(e => { const d = daysSince(e.completed_at); return d !== null && d >= 7 })
      .sort((a, b) => daysSince(b.completed_at) - daysSince(a.completed_at))
      .slice(0, 3),
    [entries]
  )

  const filtered = useMemo(() => entries.filter(e => {
    if (typeFilter !== 'all' && e.type !== typeFilter) return false
    if (scoreFilter === 'strong' && e.assessment_score !== 'strong') return false
    if (scoreFilter === 'review' && !e.needs_review) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return e.title?.toLowerCase().includes(q) || e.core_insight?.toLowerCase().includes(q)
    }
    return true
  }), [entries, typeFilter, scoreFilter, search])

  if (activeCard) {
    return (
      <div className="min-h-screen px-4 py-4 pb-24 max-w-lg mx-auto">
        <KnowledgeCard entry={activeCard} logs={cardLogs} onBack={() => setActiveCard(null)} />
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 pb-24 max-w-lg mx-auto animate-fade-in">

      {/* Header */}
      <div className="pt-10 pb-5">
        <p className="text-xs text-gray-600 uppercase tracking-widest mb-1">Intelligence Archive</p>
        <h1 className="text-2xl font-bold text-white tracking-tight">Library</h1>
        {!loading && <p className="text-xs text-gray-600 mt-1">{entries.length} completed {entries.length === 1 ? 'entry' : 'entries'}</p>}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 text-xs">⌕</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search title or insight..."
          className="w-full bg-surface border border-border rounded-2xl pl-8 pr-4 py-3 text-sm text-gray-300 placeholder-gray-700 focus:outline-none focus:border-border2"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-2">
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setTypeFilter(f.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              typeFilter === f.id ? 'bg-white/10 text-white border-white/20' : 'text-gray-600 border-border'
            }`}>
            {f.label}
          </button>
        ))}
        <div className="w-px bg-border mx-1" />
        {SCORE_FILTERS.map(f => (
          <button key={f.id} onClick={() => setScoreFilter(f.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              scoreFilter === f.id ? 'bg-white/10 text-white border-white/20' : 'text-gray-600 border-border'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Revision due alert */}
      {revisionDue.length > 0 && (
        <div className="mt-4 mb-5 bg-amber-500/5 border border-amber-500/20 rounded-2xl overflow-hidden">
          <div className="px-4 pt-3 pb-1">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest">Revision Due</p>
          </div>
          {revisionDue.map(e => (
            <button key={e.id} onClick={() => handleViewCard(e)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-amber-500/5 transition-colors">
              <div>
                <p className="text-sm font-medium text-white">{e.title}</p>
                <p className="text-xs text-amber-500/70 mt-0.5">{daysSince(e.completed_at)} days since completed</p>
              </div>
              <span className="text-xs text-amber-400 shrink-0 ml-3">Revise →</span>
            </button>
          ))}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-3 mt-4">
          {[1,2,3].map(i => <div key={i} className="h-24 skeleton" />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-700 text-sm">
            {entries.length === 0 ? 'No completed entries yet.' : 'No entries match your filters.'}
          </p>
        </div>
      )}

      {/* Cards */}
      {!loading && (
        <div className="space-y-2 mt-4">
          {filtered.map(e => {
            const cfg = TYPE_CONFIG[e.type] || {}
            const score = SCORE_CONFIG[e.assessment_score]
            const days = daysSince(e.completed_at)
            return (
              <button
                key={e.id}
                onClick={() => handleViewCard(e)}
                className="w-full text-left bg-surface border border-border hover:border-border2 rounded-2xl overflow-hidden transition-all group"
              >
                <div className="flex">
                  {/* Color strip */}
                  <div className={`w-1 shrink-0 ${cfg.bar}`} />

                  <div className="flex-1 px-4 py-3.5 min-w-0">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-sm font-semibold text-white leading-snug truncate">{e.title}</p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {e.needs_review && (
                          <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-lg">⚠</span>
                        )}
                        {score && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-lg border ${score.bg} ${score.color} ${score.border}`}>
                            {score.label}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Core insight */}
                    {e.core_insight && (
                      <p className={`text-xs italic leading-relaxed mb-2 line-clamp-2 ${cfg.color}`}>{e.core_insight}</p>
                    )}

                    {/* Bottom row */}
                    <div className="flex items-center gap-3 text-xs text-gray-700">
                      <span className={`capitalize font-medium ${cfg.color}`}>{e.type}</span>
                      {days !== null && <span>{days}d ago</span>}
                      {e.estimated_sessions && <span>{e.estimated_sessions} sessions</span>}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <BottomNav />
    </div>
  )
}
