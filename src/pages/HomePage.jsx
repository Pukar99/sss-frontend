import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  getStockEntries, getLearningEntries, getProgressLogs,
  getAlignmentScore, saveAlignmentScore, aiAlignment,
} from '../api/index'
import BottomNav from '../components/shared/BottomNav'

function getGreeting() {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Good morning, Pukar.'
  if (h >= 12 && h < 17) return 'Good afternoon, Pukar.'
  if (h >= 17 && h < 22) return 'Good evening, Pukar.'
  return 'Still up, Pukar.'
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function getDate() {
  return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

const BLOCKS = [
  { type: 'stock', label: 'Stock', description: 'Trade journal · Research', dot: 'bg-amber-400', color: 'text-amber-400', bg: 'bg-amber-500/5', border: 'border-amber-500/20', activeBorder: 'border-amber-500/30', logPath: '/log?type=stock' },
  { type: 'skill', label: 'Skill', description: 'Plan · Progress · Master', dot: 'bg-blue-400', color: 'text-blue-400', bg: 'bg-blue-500/5', border: 'border-blue-500/20', activeBorder: 'border-blue-500/30', logPath: '/log?type=skill' },
  { type: 'study', label: 'Study', description: 'Read · Learn · Retain', dot: 'bg-purple-400', color: 'text-purple-400', bg: 'bg-purple-500/5', border: 'border-purple-500/20', activeBorder: 'border-purple-500/30', logPath: '/log?type=study' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const today = todayStr()

  const [stockEntries, setStockEntries] = useState([])
  const [skillEntries, setSkillEntries] = useState([])
  const [studyEntries, setStudyEntries] = useState([])
  const [alignment, setAlignment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [scoringAlignment, setScoringAlignment] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [stock, skill, study, align] = await Promise.all([
        getStockEntries(today).catch(() => []),
        getLearningEntries({ type: 'skill' }).catch(() => []),
        getLearningEntries({ type: 'study' }).catch(() => []),
        getAlignmentScore(today).catch(() => null),
      ])
      setStockEntries(stock || [])
      // For skill/study: check if there's a progress log today
      const skillLogged = await checkLearningLoggedToday(skill)
      const studyLogged = await checkLearningLoggedToday(study)
      setSkillEntries(skillLogged)
      setStudyEntries(studyLogged)
      setAlignment(align)
    } catch (_) {}
    finally { setLoading(false) }
  }, [today])

  async function checkLearningLoggedToday(entries) {
    const inProgress = entries.filter(e => e.status === 'progress')
    const results = []
    for (const e of inProgress) {
      try {
        const logs = await getProgressLogs(e.id)
        const hasToday = logs.some(l => l.date === today)
        if (hasToday) results.push({ ...e, loggedToday: true })
        else results.push(e)
      } catch (_) {
        results.push(e)
      }
    }
    return [...results, ...entries.filter(e => e.status !== 'progress')]
  }

  useEffect(() => { fetchAll() }, [fetchAll])

  const stockDone = stockEntries.length > 0
  const skillDone = skillEntries.some(e => e.loggedToday)
  const studyDone = studyEntries.some(e => e.loggedToday)
  const loggedToday = { stock: stockDone, skill: skillDone, study: studyDone }
  const doneCount = [stockDone, skillDone, studyDone].filter(Boolean).length
  const allDone = doneCount === 3

  // What was logged — show specific title/symbol
  function getBlockDetail(type) {
    if (type === 'stock') {
      const trade = stockEntries.find(e => e.entry_type === 'trade')
      const research = stockEntries.find(e => e.entry_type === 'research')
      if (trade?.trades?.[0]) return trade.trades[0].symbol
      if (research?.research_entries?.[0]) return research.research_entries[0].topic
      return null
    }
    if (type === 'skill') {
      const e = skillEntries.find(e => e.loggedToday)
      return e?.title || null
    }
    if (type === 'study') {
      const e = studyEntries.find(e => e.loggedToday)
      return e?.title || null
    }
    return null
  }

  async function handleGetAlignment() {
    if (alignment) { navigate('/weekly'); return }
    setScoringAlignment(true)
    try {
      const stockSummary = stockEntries.map(e => {
        const t = e.trades?.[0]; const r = e.research_entries?.[0]
        return t ? `Trade: ${t.symbol} ${t.direction} — ${t.result}` : r ? `Research: ${r.topic}` : ''
      }).join(', ') || 'Not logged'

      const skillSummary = skillEntries.find(e => e.loggedToday)?.title || 'Not logged'
      const studySummary = studyEntries.find(e => e.loggedToday)?.title || 'Not logged'

      const result = await aiAlignment({ stock: stockSummary, skill: skillSummary, study: studySummary })
      await saveAlignmentScore({ date: today, ...result })
      setAlignment(result)
      toast.success(`Alignment score: ${result.score}/10`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setScoringAlignment(false)
    }
  }

  return (
    <div className="min-h-screen px-4 pb-24 max-w-lg mx-auto animate-fade-in">

      {/* Header */}
      <div className="pt-10 pb-5">
        <p className="text-xs text-gray-600 mb-1 tracking-wide">{getDate()}</p>
        <h1 className="text-2xl font-bold text-white tracking-tight leading-tight">{getGreeting()}</h1>
        <p className="text-xs text-gray-600 mt-1.5">
          {loading ? '' : doneCount === 0 ? 'Nothing logged yet.' : doneCount === 3 ? 'All 3 blocks done today.' : `${doneCount} of 3 blocks logged.`}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-px bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-px bg-gradient-to-r from-amber-400 via-blue-400 to-purple-400 transition-all duration-700"
            style={{ width: loading ? '0%' : `${(doneCount / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Today's blocks */}
      <p className="text-xs font-medium text-gray-600 uppercase tracking-widest mb-3">Today</p>

      <div className="space-y-2">
        {BLOCKS.map((b) => {
          const done = loggedToday[b.type]
          const detail = done ? getBlockDetail(b.type) : null

          return (
            <div
              key={b.type}
              onClick={() => navigate(b.logPath)}
              className={`flex items-center justify-between rounded-2xl px-4 py-4 border cursor-pointer transition-all ${
                done
                  ? `${b.bg} ${b.activeBorder}`
                  : 'bg-surface border-border hover:border-border2'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-2 h-2 rounded-full shrink-0 ${done ? b.dot : 'bg-gray-700'}`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-semibold ${done ? b.color : 'text-gray-400'}`}>{b.label}</p>
                    {done && <span className="text-xs text-gray-600">✓</span>}
                  </div>
                  <p className="text-xs mt-0.5 truncate max-w-[200px]">
                    {loading
                      ? <span className="text-gray-700">—</span>
                      : detail
                        ? <span className="text-gray-400">{detail}</span>
                        : <span className="text-gray-600">{b.description}</span>
                    }
                  </p>
                </div>
              </div>
              <span className={`text-xs shrink-0 ml-3 ${done ? 'text-gray-600' : b.color + ' opacity-60'}`}>
                {done ? 'View →' : '+ Log'}
              </span>
            </div>
          )
        })}
      </div>

      {/* Alignment score */}
      {!loading && (
        <div className="mt-5">
          {alignment ? (
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 uppercase tracking-widest">Alignment</p>
                <span className="font-mono text-lg font-bold text-white">{alignment.score}<span className="text-xs text-gray-600 font-normal">/10</span></span>
              </div>
              {alignment.feedback && <p className="text-sm text-gray-400 leading-relaxed">{alignment.feedback}</p>}
              {alignment.suggestion && (
                <p className="text-xs text-gray-600 border-t border-border pt-2 mt-2">→ {alignment.suggestion}</p>
              )}
            </div>
          ) : allDone ? (
            <button
              onClick={handleGetAlignment}
              disabled={scoringAlignment}
              className="w-full bg-gradient-to-r from-amber-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-purple-500/30 border border-amber-500/20 text-white px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all disabled:opacity-50"
            >
              {scoringAlignment ? 'Scoring...' : 'Get AI Alignment Score →'}
            </button>
          ) : null}
        </div>
      )}

      <BottomNav />
    </div>
  )
}
