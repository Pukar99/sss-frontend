import { useState, useEffect } from 'react'
import { aiAssess, aiInsight, updateLearningEntry, getProgressLogs } from '../../api/index'
import PhaseIndicator from '../shared/PhaseIndicator'

export default function AssessmentPhase({ entry, type, onComplete, onBack }) {
  const [step, setStep] = useState('loading') // loading | question | answering | scoring | followup | result | saving
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [followup, setFollowup] = useState('')
  const [followupAnswer, setFollowupAnswer] = useState('')
  const [score, setScore] = useState(null) // 'strong' | 'partial' | 'weak'
  const [feedback, setFeedback] = useState('')
  const [logs, setLogs] = useState([])
  const [error, setError] = useState('')

  const accent = type === 'skill' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-purple-600 hover:bg-purple-500'
  const color = type === 'skill' ? 'text-blue-400' : 'text-purple-400'

  useEffect(() => {
    generateQuestion()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function generateQuestion() {
    setStep('loading')
    setError('')
    try {
      const logData = await getProgressLogs(entry.id)
      setLogs(logData)
      const result = await aiAssess({
        title: entry.title,
        logs: logData.map(l => ({ date: l.date, notes: l.notes })),
      })
      setQuestion(result.question)
      setStep('answering')
    } catch (err) {
      setError(err.message)
      setStep('question')
    }
  }

  async function handleSubmitAnswer() {
    if (!answer.trim()) return
    setStep('scoring')
    setError('')
    try {
      const result = await aiAssess({
        title: entry.title,
        question,
        answer: answer.trim(),
      })
      setScore(result.score)
      setFeedback(result.feedback)
      if (result.score === 'partial' && result.followup) {
        setFollowup(result.followup)
        setStep('followup')
      } else {
        setStep('result')
      }
    } catch (err) {
      setError(err.message)
      setStep('answering')
    }
  }

  async function handleSubmitFollowup() {
    if (!followupAnswer.trim()) return
    setStep('scoring')
    setError('')
    try {
      const result = await aiAssess({
        title: entry.title,
        question: followup,
        answer: followupAnswer.trim(),
      })
      setScore(result.score === 'partial' ? 'weak' : result.score)
      setFeedback(result.feedback)
      setStep('result')
    } catch (err) {
      setError(err.message)
      setStep('followup')
    }
  }

  async function handleComplete(needsReview = false) {
    setStep('saving')
    setError('')
    try {
      // Generate core insight
      const insightResult = await aiInsight({
        title: entry.title,
        logs: logs.map(l => ({ date: l.date, notes: l.notes })),
      })

      await updateLearningEntry(entry.id, {
        assessment_score: score,
        needs_review: needsReview,
        core_insight: insightResult.insight,
        status: 'done',
        completed_at: new Date().toISOString(),
      })

      onComplete({ ...entry, assessment_score: score, needs_review: needsReview, core_insight: insightResult.insight })
    } catch (err) {
      setError(err.message)
      setStep('result')
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        {step === 'answering' && (
          <button type="button" onClick={onBack} className="text-gray-400 hover:text-white text-sm">
            ← Back
          </button>
        )}
        <PhaseIndicator phase={3} />
      </div>

      <div>
        <p className={`text-sm font-semibold ${color}`}>{entry.title}</p>
        <p className="text-xs text-gray-500 mt-0.5">Assessment</p>
      </div>

      {/* Loading */}
      {(step === 'loading' || step === 'scoring' || step === 'saving') && (
        <div className="py-10 text-center">
          <p className="text-gray-400 text-sm">
            {step === 'loading' && 'Reading your logs...'}
            {step === 'scoring' && 'Scoring your answer...'}
            {step === 'saving' && 'Generating insight + saving card...'}
          </p>
        </div>
      )}

      {/* Question */}
      {step === 'answering' && (
        <div className="space-y-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Assessment Question</p>
            <p className="text-sm text-gray-200">{question}</p>
          </div>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            rows={5}
            placeholder="Answer in your own words — no notes..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 resize-none"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            onClick={handleSubmitAnswer}
            disabled={!answer.trim()}
            className={`w-full ${accent} disabled:opacity-40 text-white px-4 py-2.5 rounded-lg text-sm font-medium`}
          >
            Submit →
          </button>
        </div>
      )}

      {/* Followup question (Partial outcome) */}
      {step === 'followup' && (
        <div className="space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-1">One more</p>
            <p className="text-sm text-gray-200">{followup}</p>
          </div>
          {feedback && <p className="text-xs text-gray-400 italic">{feedback}</p>}
          <textarea
            value={followupAnswer}
            onChange={e => setFollowupAnswer(e.target.value)}
            rows={4}
            placeholder="Your answer..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 resize-none"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            onClick={handleSubmitFollowup}
            disabled={!followupAnswer.trim()}
            className={`w-full ${accent} disabled:opacity-40 text-white px-4 py-2.5 rounded-lg text-sm font-medium`}
          >
            Submit →
          </button>
        </div>
      )}

      {/* Result */}
      {step === 'result' && (
        <div className="space-y-4">
          {score === 'strong' && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 space-y-1">
              <p className="text-sm font-semibold text-green-400">Solid. Assessment: Strong ✅</p>
              {feedback && <p className="text-xs text-gray-400">{feedback}</p>}
            </div>
          )}
          {score === 'partial' && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-1">
              <p className="text-sm font-semibold text-amber-400">Partial understanding.</p>
              {feedback && <p className="text-xs text-gray-400">{feedback}</p>}
            </div>
          )}
          {score === 'weak' && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-1">
              <p className="text-sm font-semibold text-red-400">Needs more work.</p>
              {feedback && <p className="text-xs text-gray-400">{feedback}</p>}
            </div>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}

          {(score === 'strong' || score === 'partial') && (
            <button
              onClick={() => handleComplete(false)}
              className={`w-full ${accent} text-white px-4 py-2.5 rounded-lg text-sm font-medium`}
            >
              View Knowledge Card →
            </button>
          )}

          {score === 'weak' && (
            <div className="space-y-2">
              <button
                onClick={onBack}
                className="w-full text-gray-400 hover:text-white border border-gray-700 px-4 py-2.5 rounded-lg text-sm"
              >
                Go back to Progress
              </button>
              <button
                onClick={() => handleComplete(true)}
                className="w-full text-gray-500 hover:text-gray-300 text-sm py-2"
              >
                Close anyway
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
