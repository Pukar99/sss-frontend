import { useState, useEffect } from 'react'
import { aiAssess, aiInsight, updateLearningEntry, getProgressLogs } from '../../api/index'
import toast from 'react-hot-toast'

const VERDICT = {
  strong: {
    label: 'Strong',
    sub: 'Solid understanding demonstrated.',
    color: 'text-green-400',
    bg: 'bg-green-500/5',
    border: 'border-green-500/20',
    bar: 'bg-green-400',
    width: '100%',
  },
  partial: {
    label: 'Partial',
    sub: 'Good foundation — some gaps remain.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/20',
    bar: 'bg-amber-400',
    width: '60%',
  },
  weak: {
    label: 'Needs Work',
    sub: 'Revisit before moving on.',
    color: 'text-red-400',
    bg: 'bg-red-500/5',
    border: 'border-red-500/20',
    bar: 'bg-red-400',
    width: '25%',
  },
}

export default function AssessmentPhase({ entry, type, onComplete, onBack }) {
  const [step, setStep] = useState('loading')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [followup, setFollowup] = useState('')
  const [followupAnswer, setFollowupAnswer] = useState('')
  const [score, setScore] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [logs, setLogs] = useState([])
  const [error, setError] = useState('')

  const isSkill = type === 'skill'
  const accent = isSkill ? 'bg-blue-600 hover:bg-blue-500' : 'bg-purple-600 hover:bg-purple-500'
  const accentText = isSkill ? 'text-blue-400' : 'text-purple-400'
  const accentDot = isSkill ? 'bg-blue-400' : 'bg-purple-400'

  useEffect(() => { generateQuestion() }, []) // eslint-disable-line

  async function generateQuestion() {
    setStep('loading'); setError('')
    try {
      const logData = await getProgressLogs(entry.id)
      setLogs(logData)
      const result = await aiAssess({ title: entry.title, logs: logData.map(l => ({ date: l.date, notes: l.notes })) })
      setQuestion(result.question); setStep('answering')
    } catch (err) { setError(err.message); setStep('error') }
  }

  async function handleSubmitAnswer() {
    if (!answer.trim()) return
    setStep('scoring'); setError('')
    try {
      const result = await aiAssess({ title: entry.title, question, answer: answer.trim() })
      setScore(result.score); setFeedback(result.feedback)
      if (result.score === 'partial' && result.followup) { setFollowup(result.followup); setStep('followup') }
      else setStep('result')
    } catch (err) { setError(err.message); setStep('answering') }
  }

  async function handleSubmitFollowup() {
    if (!followupAnswer.trim()) return
    setStep('scoring'); setError('')
    try {
      const result = await aiAssess({ title: entry.title, question: followup, answer: followupAnswer.trim() })
      setScore(result.score === 'partial' ? 'weak' : result.score); setFeedback(result.feedback); setStep('result')
    } catch (err) { setError(err.message); setStep('followup') }
  }

  async function handleComplete(needsReview = false) {
    setStep('saving'); setError('')
    try {
      const insightResult = await aiInsight({ title: entry.title, logs: logs.map(l => ({ date: l.date, notes: l.notes })) })
      await updateLearningEntry(entry.id, {
        assessment_score: score, needs_review: needsReview,
        core_insight: insightResult.insight, status: 'done',
        completed_at: new Date().toISOString(),
      })
      toast.success(needsReview ? 'Card saved — marked for review' : 'Mission complete ✓')
      onComplete({ ...entry, assessment_score: score, needs_review: needsReview, core_insight: insightResult.insight })
    } catch (err) { setError(err.message); setStep('result') }
  }

  const verdict = score ? VERDICT[score] : null

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        {step === 'answering'
          ? <button onClick={onBack} className="text-gray-600 hover:text-gray-300 text-sm">← Back</button>
          : <div />
        }
        <span className={`text-xs font-semibold uppercase tracking-widest ${accentText}`}>Debrief</span>
      </div>

      {/* Mission title */}
      <div className="flex items-center gap-2.5">
        <div className={`w-1.5 h-1.5 rounded-full ${accentDot} shrink-0`} />
        <p className="text-sm font-semibold text-gray-300 truncate">{entry.title}</p>
      </div>

      {/* Loading / Scoring / Saving */}
      {(step === 'loading' || step === 'scoring' || step === 'saving') && (
        <div className="py-20 flex flex-col items-center gap-5">
          <div className="flex gap-1.5">
            {[0,1,2].map(i => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${accentDot} animate-pulse`}
                style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
          <p className="text-xs text-gray-600">
            {step === 'loading' && 'Reading your mission logs...'}
            {step === 'scoring' && 'AI is evaluating your answer...'}
            {step === 'saving' && 'Generating insight + building your card...'}
          </p>
        </div>
      )}

      {/* Error */}
      {step === 'error' && (
        <div className="space-y-3">
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={generateQuestion} className="text-xs text-gray-500 hover:text-gray-300">Retry</button>
        </div>
      )}

      {/* Assessment question */}
      {step === 'answering' && (
        <div className="space-y-5">
          <div className="bg-surface border border-border rounded-2xl p-5">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-widest mb-3">Mission Debrief Question</p>
            <p className="text-base text-gray-100 leading-relaxed font-medium">{question}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-2">Answer from memory — no notes allowed.</p>
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              rows={6}
              placeholder="Write what you know..."
              autoFocus
              className="w-full bg-surface border border-border rounded-2xl px-4 py-3.5 text-sm text-gray-200 placeholder-gray-700 focus:outline-none focus:border-border2 resize-none leading-relaxed"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            onClick={handleSubmitAnswer}
            disabled={!answer.trim()}
            className={`w-full ${accent} disabled:opacity-30 text-white py-3.5 rounded-2xl text-sm font-bold transition-all`}
          >
            Submit for Evaluation →
          </button>
        </div>
      )}

      {/* Followup */}
      {step === 'followup' && (
        <div className="space-y-5">
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
            <p className="text-xs font-medium text-amber-500 uppercase tracking-widest mb-3">One More Question</p>
            <p className="text-base text-gray-100 leading-relaxed font-medium">{followup}</p>
          </div>
          {feedback && <p className="text-xs text-gray-600 italic">{feedback}</p>}
          <textarea
            value={followupAnswer}
            onChange={e => setFollowupAnswer(e.target.value)}
            rows={5}
            placeholder="Your answer..."
            autoFocus
            className="w-full bg-surface border border-border rounded-2xl px-4 py-3.5 text-sm text-gray-200 placeholder-gray-700 focus:outline-none focus:border-border2 resize-none leading-relaxed"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            onClick={handleSubmitFollowup}
            disabled={!followupAnswer.trim()}
            className={`w-full ${accent} disabled:opacity-30 text-white py-3.5 rounded-2xl text-sm font-bold`}
          >
            Submit →
          </button>
        </div>
      )}

      {/* Verdict */}
      {step === 'result' && verdict && (
        <div className="space-y-4">
          <div className={`${verdict.bg} border ${verdict.border} rounded-2xl p-5 space-y-3`}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-600 uppercase tracking-widest">Verdict</p>
              <span className={`text-sm font-bold ${verdict.color}`}>{verdict.label}</span>
            </div>
            <div className="h-1 bg-surface2 rounded-full overflow-hidden">
              <div className={`h-1 ${verdict.bar} rounded-full transition-all duration-700`} style={{ width: verdict.width }} />
            </div>
            {feedback && <p className="text-sm text-gray-400 leading-relaxed">{feedback}</p>}
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          {(score === 'strong' || score === 'partial') && (
            <button
              onClick={() => handleComplete(false)}
              className={`w-full ${accent} text-white py-3.5 rounded-2xl text-sm font-bold`}
            >
              View Knowledge Card →
            </button>
          )}

          {score === 'weak' && (
            <div className="space-y-2">
              <button onClick={onBack}
                className="w-full bg-surface border border-border text-gray-400 hover:text-white py-3 rounded-2xl text-sm font-medium transition-colors">
                Back to Progress
              </button>
              <button onClick={() => handleComplete(true)}
                className="w-full text-gray-600 hover:text-gray-400 text-sm py-2 transition-colors">
                Close anyway
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
