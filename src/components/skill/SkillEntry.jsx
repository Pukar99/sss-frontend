import { useState, useEffect, useCallback } from 'react'
import { getLearningEntries, getProgressLogs } from '../../api/index'
import PlanPhase from './PlanPhase'
import ProgressPhase from './ProgressPhase'
import AssessmentPhase from './AssessmentPhase'
import KnowledgeCard from './KnowledgeCard'

export default function SkillEntry({ type = 'skill', onSaved }) {
  const [topic, setTopic] = useState('')
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list') // 'list' | 'plan' | 'progress' | 'assessment' | 'card'
  const [activeEntry, setActiveEntry] = useState(null)
  const [cardLogs, setCardLogs] = useState([])

  const color = type === 'skill' ? 'text-blue-400' : 'text-purple-400'
  const accent = type === 'skill' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-purple-600 hover:bg-purple-500'

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

  function handlePlanIt() {
    if (!topic.trim()) return
    setView('plan')
  }

  function handlePlanSaved(entry) {
    setActiveEntry(entry)
    setView('progress')
    fetchEntries()
  }

  function handleContinue(entry) {
    setActiveEntry(entry)
    setView('progress')
  }

  function handleStart(entry) {
    setActiveEntry(entry)
    setView('progress')
  }

  function handleProgressSaved() {
    fetchEntries()
    onSaved()
  }

  function handleMarkComplete(entry) {
    setActiveEntry(entry)
    setView('assessment')
  }

  async function handleAssessmentComplete(updatedEntry) {
    try {
      const logs = await getProgressLogs(updatedEntry.id)
      setCardLogs(logs)
    } catch (_) {
      setCardLogs([])
    }
    setActiveEntry(updatedEntry)
    setView('card')
    fetchEntries()
  }

  async function handleViewCard(entry) {
    try {
      const logs = await getProgressLogs(entry.id)
      setCardLogs(logs)
    } catch (_) {
      setCardLogs([])
    }
    setActiveEntry(entry)
    setView('card')
  }

  if (view === 'plan') {
    return (
      <PlanPhase
        topic={topic}
        type={type}
        onSaved={handlePlanSaved}
        onBack={() => setView('list')}
      />
    )
  }

  if (view === 'progress' && activeEntry) {
    return (
      <ProgressPhase
        entry={activeEntry}
        type={type}
        onSaved={handleProgressSaved}
        onMarkComplete={handleMarkComplete}
        onBack={() => { setView('list'); fetchEntries() }}
      />
    )
  }

  if (view === 'assessment' && activeEntry) {
    return (
      <AssessmentPhase
        entry={activeEntry}
        type={type}
        onComplete={handleAssessmentComplete}
        onBack={() => setView('progress')}
      />
    )
  }

  if (view === 'card' && activeEntry) {
    return (
      <KnowledgeCard
        entry={activeEntry}
        logs={cardLogs}
        onBack={() => { setView('list'); fetchEntries() }}
      />
    )
  }

  return (
    <div className="space-y-5">
      {/* Topic input */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">
          What are you working on today?
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handlePlanIt()}
            placeholder={type === 'skill' ? 'e.g. React useCallback hook' : 'e.g. Chapter 3 of Clean Code'}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
          />
          <button
            onClick={handlePlanIt}
            disabled={!topic.trim()}
            className={`${accent} disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap`}
          >
            Plan it →
          </button>
        </div>
      </div>

      {/* In Progress */}
      {inProgress.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">In Progress</p>
          <div className="space-y-2">
            {inProgress.map(e => (
              <div key={e.id} className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
                <div>
                  <p className={`text-sm font-medium ${color}`}>{e.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{e.category || type}</p>
                </div>
                <button
                  onClick={() => handleContinue(e)}
                  className="text-xs font-medium text-gray-400 hover:text-white border border-gray-700 px-3 py-1.5 rounded-lg"
                >
                  Continue →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Planned */}
      {planned.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Planned</p>
          <div className="space-y-2">
            {planned.map(e => (
              <div key={e.id} className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{e.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{e.category || type}</p>
                </div>
                <button
                  onClick={() => handleStart(e)}
                  className="text-xs font-medium text-gray-400 hover:text-white border border-gray-700 px-3 py-1.5 rounded-lg"
                >
                  Start →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Done */}
      {done.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Completed</p>
          <div className="space-y-2">
            {done.map(e => (
              <div key={e.id} className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{e.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {e.needs_review && <span className="text-xs text-amber-400">⚠️ needs review</span>}
                    {e.assessment_score && (
                      <span className={`text-xs capitalize ${
                        e.assessment_score === 'strong' ? 'text-green-400' :
                        e.assessment_score === 'weak' ? 'text-red-400' : 'text-amber-400'
                      }`}>{e.assessment_score}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleViewCard(e)}
                  className="text-xs font-medium text-gray-400 hover:text-white border border-gray-700 px-3 py-1.5 rounded-lg"
                >
                  View →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && <p className="text-xs text-gray-500">Loading...</p>}
    </div>
  )
}
