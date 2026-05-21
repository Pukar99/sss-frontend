import { useState } from 'react'
import { aiPlan, createLearningEntry, updateLearningEntry } from '../../api/index'
import toast from 'react-hot-toast'

const RESOURCE_ICONS = { article: '📄', video: '🎬', doc: '📖', github: '⌨', course: '🎓' }

export default function PlanPhase({ topic, type, onSaved, onBack }) {
  const [step, setStep] = useState('question')
  const [answer, setAnswer] = useState('')
  const [plan, setPlan] = useState(null)
  const [editedTitle, setEditedTitle] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [error, setError] = useState('')

  const isSkill = type === 'skill'
  const accent = isSkill ? 'bg-blue-600 hover:bg-blue-500' : 'bg-purple-600 hover:bg-purple-500'
  const accentText = isSkill ? 'text-blue-400' : 'text-purple-400'
  const accentBorder = isSkill ? 'border-blue-500/30' : 'border-purple-500/30'
  const accentBg = isSkill ? 'bg-blue-500/5' : 'bg-purple-500/5'

  async function handleAnswer() {
    if (!answer.trim()) return
    setStep('loading')
    setError('')
    try {
      const result = await aiPlan(answer, topic)
      setPlan(result)
      setEditedTitle(result.title)
      setStep(result.too_large ? 'split' : 'plan')
    } catch (err) {
      setError(err.message)
      setStep('question')
    }
  }

  async function handleStartMission() {
    setStep('saving')
    try {
      const title = editedTitle.trim() || plan.title
      const entry = await createLearningEntry({
        type, title,
        plan_steps: plan.steps.map(s => ({ step: s.step, time: s.time, done: false })),
        resources: plan.resources || [],
        ai_notes: plan.concept_note || null,
        estimated_sessions: plan.estimated_sessions || null,
      })
      const updated = await updateLearningEntry(entry.id, { status: 'progress' })
      toast.success('Mission started')
      onSaved(updated)
    } catch (err) {
      setError(err.message)
      setStep('plan')
    }
  }

  async function handleUseSplit(splitTopic) {
    setStep('loading')
    try {
      const result = await aiPlan(answer, splitTopic)
      setPlan(result); setEditedTitle(result.title); setStep('plan')
    } catch (err) { setError(err.message); setStep('split') }
  }

  async function handleKeepAsOne() {
    setStep('loading')
    try {
      const result = await aiPlan(answer, topic)
      setPlan({ ...result, too_large: false }); setEditedTitle(result.title); setStep('plan')
    } catch (err) { setError(err.message); setStep('split') }
  }

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="text-gray-600 hover:text-gray-300 text-sm">← Back</button>
        <span className={`text-xs font-semibold uppercase tracking-widest ${accentText}`}>Mission Brief</span>
      </div>

      {/* Topic pill */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ${accentBg} ${accentBorder}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${isSkill ? 'bg-blue-400' : 'bg-purple-400'}`} />
        <p className={`text-xs font-semibold ${accentText}`}>{topic}</p>
      </div>

      {/* Question */}
      {step === 'question' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white leading-snug mb-1">What's the mission objective?</h2>
            <p className="text-xs text-gray-600">What do you want to walk away knowing or being able to do?</p>
          </div>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && e.metaKey && handleAnswer()}
            rows={5}
            placeholder={isSkill
              ? 'e.g. I want to be able to build a custom React hook that fetches and caches API data...'
              : 'e.g. I want to understand the core principles of clean code and be able to spot violations...'
            }
            autoFocus
            className="w-full bg-surface border border-border rounded-2xl px-4 py-3.5 text-sm text-gray-200 placeholder-gray-700 focus:outline-none focus:border-border2 resize-none leading-relaxed"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            onClick={handleAnswer}
            disabled={!answer.trim()}
            className={`w-full ${accent} disabled:opacity-30 text-white py-3 rounded-2xl text-sm font-bold transition-all`}
          >
            Brief the AI →
          </button>
        </div>
      )}

      {/* Loading */}
      {step === 'loading' && (
        <div className="py-16 flex flex-col items-center gap-4">
          <div className="flex gap-1.5">
            {[0,1,2].map(i => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${isSkill ? 'bg-blue-400' : 'bg-purple-400'} animate-pulse`}
                style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
          <p className="text-xs text-gray-600">AI is building your mission plan...</p>
        </div>
      )}

      {/* Split suggestion */}
      {step === 'split' && plan && (
        <div className="space-y-4">
          <div className={`${accentBg} border ${accentBorder} rounded-2xl p-4`}>
            <p className={`text-sm font-bold ${accentText} mb-1`}>This mission is large</p>
            <p className="text-xs text-gray-500">Consider splitting into focused sub-missions:</p>
          </div>
          <div className="space-y-2">
            {(plan.splits || []).map((s, i) => (
              <div key={i} className="flex items-center justify-between bg-surface border border-border rounded-2xl px-4 py-3.5">
                <p className="text-sm text-gray-300 leading-snug">{s}</p>
                <button onClick={() => handleUseSplit(s)}
                  className={`text-xs font-semibold ${accentText} shrink-0 ml-3 hover:opacity-80`}>
                  Use →
                </button>
              </div>
            ))}
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button onClick={handleKeepAsOne}
            className="w-full text-gray-600 hover:text-gray-400 text-sm py-2">
            Keep as one mission
          </button>
        </div>
      )}

      {/* Plan */}
      {(step === 'plan' || step === 'saving') && plan && (
        <div className="space-y-4">
          {/* Mission title */}
          <div className={`${accentBg} border ${accentBorder} rounded-2xl p-4 space-y-2`}>
            {editingTitle ? (
              <input
                type="text" value={editedTitle}
                onChange={e => setEditedTitle(e.target.value)}
                onBlur={() => setEditingTitle(false)}
                autoFocus
                className="w-full bg-surface2 border border-border rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none"
              />
            ) : (
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-bold text-white leading-snug">{editedTitle}</h3>
                <button onClick={() => setEditingTitle(true)} className="text-xs text-gray-600 hover:text-gray-400 shrink-0 mt-0.5">Edit</button>
              </div>
            )}
            <p className="text-xs text-gray-600">~{plan.estimated_sessions} session{plan.estimated_sessions !== 1 ? 's' : ''} estimated</p>
          </div>

          {/* Steps */}
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-widest mb-2.5">Mission Steps</p>
            <div className="space-y-2">
              {(plan.steps || []).map((s, i) => (
                <div key={i} className="flex gap-3 bg-surface border border-border rounded-2xl px-4 py-3.5">
                  <span className={`text-xs font-bold ${accentText} mt-0.5 shrink-0 w-5`}>{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-200 leading-snug">{s.step}</p>
                    {s.time && (
                      <span className="inline-block mt-1 text-xs text-gray-600 bg-surface2 px-2 py-0.5 rounded-lg">{s.time}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Concept note */}
          {plan.concept_note && (
            <div className="bg-surface border border-border rounded-2xl p-4">
              <p className="text-xs font-medium text-gray-600 uppercase tracking-widest mb-2">AI Briefing</p>
              <p className="text-sm text-gray-400 italic leading-relaxed">{plan.concept_note}</p>
            </div>
          )}

          {/* Resources */}
          {(plan.resources || []).length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-widest mb-2.5">Resources</p>
              <div className="flex flex-wrap gap-2">
                {plan.resources.map((r, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-surface border border-border rounded-xl px-3 py-1.5">
                    <span className="text-xs">{RESOURCE_ICONS[r.type] || '🔗'}</span>
                    <span className="text-xs text-gray-400">{r.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            onClick={handleStartMission}
            disabled={step === 'saving'}
            className={`w-full ${accent} disabled:opacity-50 text-white py-3.5 rounded-2xl text-sm font-bold transition-all`}
          >
            {step === 'saving' ? 'Launching...' : 'Start Mission →'}
          </button>
        </div>
      )}
    </div>
  )
}
