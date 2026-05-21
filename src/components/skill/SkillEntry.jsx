import { useState, useEffect, useCallback } from 'react'
import { getLearningEntries, getProgressLogs } from '../../api/index'
import PlanPhase from './PlanPhase'
import ProgressPhase from './ProgressPhase'
import AssessmentPhase from './AssessmentPhase'
import KnowledgeCard from './KnowledgeCard'

const scoreColor = { strong: 'text-green-400', partial: 'text-amber-400', weak: 'text-red-400' }

export default function SkillEntry({ type = 'skill', onSaved }) {
  const [topic, setTopic] = useState('')
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list')
  const [activeEntry, setActiveEntry] = useState(null)
  const [cardLogs, setCardLogs] = useState([])

  const color = type === 'skill' ? 'text-blue-400' : 'text-purple-400'
  const accent = type === 'skill'
    ? 'bg-blue-600 hover:bg-blue-500'
    : 'bg-purple-600 hover:bg-purple-500'
  const dot = type === 'skill' ? 'bg-blue-400' : 'bg-purple-400'

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getLearningEntries({ type })
      setEntries(data)
    } catch (_) {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [type])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const inProgress = entries.filter(e => e.status === 'progress')
  const planned = entries.filter(e => e.status === 'plan')
  const done = entries.filter(e => e.status === 'done')

  function handlePlanIt() { if (!topic.trim()) return; setView('plan') }
  function handlePlanSaved(entry) { setActiveEntry(entry); setView('progress'); fetchEntries() }
  function handleContinue(entry) { setActiveEntry(entry); setView('progress') }
  function handleStart(entry) { setActiveEntry(entry); setView('progress') }
  function handleProgressSaved() { fetchEntries(); onSaved() }
  function handleMarkComplete(entry) { setActiveEntry(entry); setView('assessment') }

  async function handleAssessmentComplete(updatedEntry) {
    try { setCardLogs(await getProgressLogs(updatedEntry.id)) } catch (_) { setCardLogs([]) }
    setActiveEntry(updatedEntry); setView('card'); fetchEntries()
  }

  async function handleViewCard(entry) {
    try { setCardLogs(await getProgressLogs(entry.id)) } catch (_) { setCardLogs([]) }
    setActiveEntry(entry); setView('card')
  }

  if (view === 'plan') return <PlanPhase topic={topic} type={type} onSaved={handlePlanSaved} onBack={() => setView('list')} />
  if (view === 'progress' && activeEntry) return <ProgressPhase entry={activeEntry} type={type} onSaved={handleProgressSaved} onMarkComplete={handleMarkComplete} onBack={() => { setView('list'); fetchEntries() }} />
  if (view === 'assessment' && activeEntry) return <AssessmentPhase entry={activeEntry} type={type} onComplete={handleAssessmentComplete} onBack={() => setView('progress')} />
  if (view === 'card' && activeEntry) return <KnowledgeCard entry={activeEntry} logs={cardLogs} onBack={() => { setView('list'); fetchEntries() }} />

  return (
    <div className="space-y-6">

      {/* New entry input */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4">
        <p className="text-xs text-gray-500 mb-3">What are you working on today?</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handlePlanIt()}
            placeholder={type === 'skill' ? 'e.g. React useCallback hook' : 'e.g. Chapter 3 of Clean Code'}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500"
          />
          <button
            onClick={handlePlanIt}
            disabled={!topic.trim()}
            className={`${accent} disabled:opacity-30 text-white px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all`}
          >
            Plan →
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="h-14 bg-gray-800/40 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* In Progress */}
      {!loading && inProgress.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">In Progress</p>
          <div className="space-y-2">
            {inProgress.map(e => (
              <div key={e.id} className="flex items-center justify-between bg-gray-800/60 border border-gray-700 hover:border-gray-600 rounded-2xl px-4 py-3.5 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full ${dot} shrink-0 animate-pulse`} />
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${color} truncate`}>{e.title}</p>
                    {e.estimated_sessions && (
                      <p className="text-xs text-gray-600 mt-0.5">~{e.estimated_sessions} sessions</p>
                    )}
                  </div>
                </div>
                <button onClick={() => handleContinue(e)} className="text-xs font-medium text-gray-400 hover:text-white shrink-0 ml-3">
                  Continue →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Planned */}
      {!loading && planned.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Planned</p>
          <div className="space-y-2">
            {planned.map(e => (
              <div key={e.id} className="flex items-center justify-between bg-gray-800/60 border border-gray-700 hover:border-gray-600 rounded-2xl px-4 py-3.5 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-gray-600 shrink-0" />
                  <p className="text-sm font-medium text-gray-300 truncate">{e.title}</p>
                </div>
                <button onClick={() => handleStart(e)} className="text-xs font-medium text-gray-400 hover:text-white shrink-0 ml-3">
                  Start →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Done */}
      {!loading && done.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Completed</p>
          <div className="space-y-2">
            {done.map(e => (
              <div key={e.id} className="flex items-center justify-between bg-gray-800/30 border border-gray-800 rounded-2xl px-4 py-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-green-500/60 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-400 truncate">{e.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {e.needs_review && <span className="text-xs text-amber-400">⚠ review</span>}
                      {e.assessment_score && (
                        <span className={`text-xs capitalize ${scoreColor[e.assessment_score] || 'text-gray-500'}`}>
                          {e.assessment_score}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={() => handleViewCard(e)} className="text-xs text-gray-500 hover:text-gray-300 shrink-0 ml-3">
                  View →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && entries.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600 text-sm">No {type} entries yet.</p>
          <p className="text-gray-700 text-xs mt-1">Type a topic above and plan your first mission.</p>
        </div>
      )}
    </div>
  )
}
