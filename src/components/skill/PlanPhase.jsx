import { useState } from 'react'
import { aiPlan, createLearningEntry, updateLearningEntry } from '../../api/index'
import PhaseIndicator from '../shared/PhaseIndicator'
import toast from 'react-hot-toast'

export default function PlanPhase({ topic, type, onSaved, onBack }) {
  const [step, setStep] = useState('question') // 'question' | 'loading' | 'plan' | 'split' | 'saving'
  const [answer, setAnswer] = useState('')
  const [plan, setPlan] = useState(null)
  const [editedTitle, setEditedTitle] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [error, setError] = useState('')

  const accent = type === 'skill' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-purple-600 hover:bg-purple-500'
  const color = type === 'skill' ? 'text-blue-400' : 'text-purple-400'

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
        type,
        title,
        plan_steps: plan.steps.map(s => ({ step: s.step, time: s.time, done: false })),
        resources: plan.resources || [],
        ai_notes: plan.concept_note || null,
        estimated_sessions: plan.estimated_sessions || null,
      })
      // Move to progress status
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
      setPlan(result)
      setEditedTitle(result.title)
      setStep('plan')
    } catch (err) {
      setError(err.message)
      setStep('split')
    }
  }

  async function handleKeepAsOne() {
    setStep('loading')
    try {
      const result = await aiPlan(answer, topic)
      const forcedPlan = { ...result, too_large: false }
      setPlan(forcedPlan)
      setEditedTitle(forcedPlan.title)
      setStep('plan')
    } catch (err) {
      setError(err.message)
      setStep('split')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="text-gray-400 hover:text-white text-sm">
          ← Back
        </button>
        <PhaseIndicator phase={1} />
      </div>

      <div>
        <p className={`text-xs font-semibold ${color} uppercase tracking-wide mb-1`}>{topic}</p>
      </div>

      {/* Step: question */}
      {step === 'question' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-200">
            What do you want to walk away knowing or being able to do after this?
          </p>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            rows={4}
            placeholder="Be specific — this shapes your entire plan..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 resize-none"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            onClick={handleAnswer}
            disabled={!answer.trim()}
            className={`w-full ${accent} disabled:opacity-40 text-white px-4 py-2.5 rounded-lg text-sm font-medium`}
          >
            Generate Plan →
          </button>
        </div>
      )}

      {/* Step: loading */}
      {step === 'loading' && (
        <div className="py-10 text-center">
          <p className="text-gray-400 text-sm">AI is building your plan...</p>
        </div>
      )}

      {/* Step: split — topic too large */}
      {step === 'split' && plan && (
        <div className="space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <p className="text-sm text-amber-400 font-medium mb-1">This topic is large</p>
            <p className="text-xs text-gray-400">Consider splitting into focused missions:</p>
          </div>
          <div className="space-y-2">
            {(plan.splits || []).map((s, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
                <p className="text-sm text-white">{s}</p>
                <button
                  onClick={() => handleUseSplit(s)}
                  className="text-xs font-medium text-gray-400 hover:text-white border border-gray-700 px-3 py-1.5 rounded-lg ml-3 shrink-0"
                >
                  Use this →
                </button>
              </div>
            ))}
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            onClick={handleKeepAsOne}
            className="w-full text-gray-400 hover:text-white border border-gray-700 px-4 py-2.5 rounded-lg text-sm"
          >
            Keep as one
          </button>
        </div>
      )}

      {/* Step: plan */}
      {step === 'plan' && plan && (
        <div className="space-y-4">
          {/* Title */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-1">
            {editingTitle ? (
              <input
                type="text"
                value={editedTitle}
                onChange={e => setEditedTitle(e.target.value)}
                onBlur={() => setEditingTitle(false)}
                autoFocus
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
              />
            ) : (
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-white">{editedTitle}</p>
                <button onClick={() => setEditingTitle(true)} className="text-xs text-gray-500 hover:text-gray-300 shrink-0">
                  Edit
                </button>
              </div>
            )}
            <p className="text-xs text-gray-500">~{plan.estimated_sessions} session{plan.estimated_sessions !== 1 ? 's' : ''}</p>
          </div>

          {/* Steps */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Plan</p>
            <div className="space-y-2">
              {(plan.steps || []).map((s, i) => (
                <div key={i} className="flex gap-3 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
                  <span className="text-xs text-gray-500 mt-0.5 shrink-0">{i + 1}.</span>
                  <div>
                    <p className="text-sm text-white">{s.step}</p>
                    {s.time && <p className="text-xs text-gray-500 mt-0.5">{s.time}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Concept note */}
          {plan.concept_note && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Concept Note</p>
              <p className="text-sm text-gray-200 italic">{plan.concept_note}</p>
            </div>
          )}

          {/* Resources */}
          {(plan.resources || []).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Resources</p>
              <div className="space-y-1">
                {plan.resources.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 px-1">
                    <span className="text-xs text-gray-500 uppercase">{r.type}</span>
                    <p className="text-sm text-gray-300">{r.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            onClick={handleStartMission}
            disabled={step === 'saving'}
            className={`w-full ${accent} disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium`}
          >
            {step === 'saving' ? 'Starting...' : 'Start Mission →'}
          </button>
        </div>
      )}
    </div>
  )
}
