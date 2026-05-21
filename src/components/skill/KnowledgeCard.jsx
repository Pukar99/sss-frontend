import { useState } from 'react'

const TABS = [
  { id: 'plan', label: 'Plan' },
  { id: 'logs', label: 'Logs' },
  { id: 'media', label: 'Media' },
  { id: 'resources', label: 'Resources' },
]

const scoreStyle = {
  strong: { color: 'text-green-400', bg: 'bg-green-500/10', label: 'Strong' },
  partial: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Partial' },
  weak: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Needs Review' },
}

export default function KnowledgeCard({ entry, logs = [], onBack }) {
  const [tab, setTab] = useState('plan')

  const steps = entry.plan_steps || []
  const resources = entry.resources || []
  const isSkill = entry.type === 'skill'
  const accentColor = isSkill ? 'text-blue-400' : 'text-purple-400'
  const accentBg = isSkill ? 'bg-blue-500/10' : 'bg-purple-500/10'
  const accentBorder = isSkill ? 'border-blue-500/20' : 'border-purple-500/20'
  const score = scoreStyle[entry.assessment_score]

  const completedAt = entry.completed_at
    ? new Date(entry.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  const doneSteps = steps.filter(s => s.done).length

  return (
    <div className="space-y-4">
      {/* Back */}
      <button onClick={onBack} className="text-gray-500 hover:text-gray-300 text-sm flex items-center gap-1">
        ← Back
      </button>

      {/* Header */}
      <div className={`${accentBg} border ${accentBorder} rounded-2xl p-4 space-y-3`}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${accentBg} ${accentColor} capitalize`}>
                {entry.type}
              </span>
              {score && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${score.bg} ${score.color}`}>
                  {score.label}
                </span>
              )}
              {entry.needs_review && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                  ⚠ Review
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-white leading-snug">{entry.title}</h2>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
          {completedAt && <span>{completedAt}</span>}
          {logs.length > 0 && <span>· {logs.length} session{logs.length !== 1 ? 's' : ''}</span>}
          {steps.length > 0 && <span>· {doneSteps}/{steps.length} steps</span>}
        </div>

        {/* Core insight */}
        {entry.core_insight && (
          <div className="border-t border-white/5 pt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">Core Insight</p>
            <p className={`text-sm italic leading-relaxed ${accentColor}`}>{entry.core_insight}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-800/60 rounded-xl p-1 gap-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              tab === t.id ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Plan */}
      {tab === 'plan' && (
        <div className="space-y-2">
          {steps.length === 0 && <p className="text-xs text-gray-600 py-4 text-center">No steps recorded.</p>}
          {steps.map((s, i) => (
            <div key={i} className={`flex items-start gap-3 rounded-xl px-4 py-3 border ${
              s.done ? 'bg-gray-800/30 border-gray-800' : 'bg-gray-800/60 border-gray-700'
            }`}>
              <div className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                s.done ? 'border-blue-500 bg-blue-500' : 'border-gray-600'
              }`}>
                {s.done && <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
              </div>
              <div className="min-w-0">
                <p className={`text-sm ${s.done ? 'text-gray-600 line-through' : 'text-gray-200'}`}>{s.step}</p>
                {s.time && <p className="text-xs text-gray-600 mt-0.5">{s.time}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: My Logs */}
      {tab === 'logs' && (
        <div className="space-y-2">
          {logs.length === 0 && <p className="text-xs text-gray-600 py-4 text-center">No logs recorded.</p>}
          {logs.map(log => (
            <div key={log.id} className="bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 space-y-1.5">
              <p className="text-xs text-gray-600">{log.date}</p>
              <p className="text-sm text-gray-300 leading-relaxed">{log.notes}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Media */}
      {tab === 'media' && (
        <div className="space-y-3">
          {logs.every(l => (!l.photo_urls || l.photo_urls.length === 0) && !l.video_url)
            ? <p className="text-xs text-gray-600 py-4 text-center">No media attached.</p>
            : logs.map(log => (
              <div key={log.id} className="space-y-2">
                {(log.photo_urls || []).map((url, i) => (
                  <img key={i} src={url} alt="session" className="w-full rounded-xl border border-gray-700 object-cover" />
                ))}
                {log.video_url && (
                  <a href={log.video_url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-blue-400 hover:text-blue-300">
                    <span>▶</span>
                    <span className="truncate">{log.video_url}</span>
                  </a>
                )}
              </div>
            ))
          }
        </div>
      )}

      {/* Tab: Resources */}
      {tab === 'resources' && (
        <div className="space-y-2">
          {resources.length === 0 && !entry.ai_notes && (
            <p className="text-xs text-gray-600 py-4 text-center">No resources saved.</p>
          )}
          {resources.map((r, i) => (
            <div key={i} className="bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs text-gray-600 uppercase tracking-wide">{r.type}</span>
                <p className="text-sm text-white font-medium">{r.title}</p>
              </div>
              {r.url && (
                <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline break-all">
                  {r.url}
                </a>
              )}
            </div>
          ))}
          {entry.ai_notes && (
            <div className="bg-gray-800/40 border border-gray-800 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">AI Note</p>
              <p className="text-sm text-gray-400 italic leading-relaxed">{entry.ai_notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => alert('Revision coming soon.')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
            entry.needs_review
              ? 'border-amber-500/40 text-amber-400 bg-amber-500/5 hover:bg-amber-500/10'
              : 'border-gray-700 text-gray-500 hover:text-gray-300'
          }`}
        >
          Revise
        </button>
        <button
          onClick={() => alert('Go Deeper coming soon.')}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-700 text-gray-500 hover:text-gray-300 transition-colors"
        >
          Go Deeper
        </button>
      </div>
    </div>
  )
}
