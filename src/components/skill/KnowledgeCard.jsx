import { useState } from 'react'

const TABS = [
  { id: 'plan', label: '📋 Plan' },
  { id: 'logs', label: '📝 My Logs' },
  { id: 'media', label: '📎 Media' },
  { id: 'resources', label: '📚 Resources' },
]

export default function KnowledgeCard({ entry, logs = [], onBack }) {
  const [tab, setTab] = useState('plan')

  const steps = entry.plan_steps || []
  const resources = entry.resources || []
  const color = entry.type === 'skill' ? 'text-blue-400' : 'text-purple-400'
  const badge = entry.type === 'skill' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'

  const completedAt = entry.completed_at
    ? new Date(entry.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  const scoreColor = {
    strong: 'text-green-400',
    partial: 'text-amber-400',
    weak: 'text-red-400',
  }[entry.assessment_score] || 'text-gray-400'

  return (
    <div className="space-y-4">
      {/* Back */}
      <button onClick={onBack} className="text-gray-400 hover:text-white text-sm">
        ← Back
      </button>

      {/* Header card */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge}`}>
                {entry.type}
              </span>
              {entry.needs_review && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                  ⚠️ Needs review
                </span>
              )}
            </div>
            <h2 className="text-base font-semibold text-white">{entry.title}</h2>
          </div>
          {entry.assessment_score && (
            <span className={`text-xs font-semibold capitalize shrink-0 ${scoreColor}`}>
              {entry.assessment_score} ✓
            </span>
          )}
        </div>

        <div className="flex gap-4 text-xs text-gray-500">
          {completedAt && <span>Completed {completedAt}</span>}
          {logs.length > 0 && <span>{logs.length} session{logs.length !== 1 ? 's' : ''}</span>}
          {entry.estimated_sessions && <span>~{entry.estimated_sessions} planned</span>}
        </div>

        {/* Core insight */}
        {entry.core_insight && (
          <div className="border-t border-gray-700 pt-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Core Insight</p>
            <p className={`text-sm italic ${color}`}>{entry.core_insight}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              tab === t.id ? 'text-white border-b-2 border-blue-500' : 'text-gray-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Plan */}
      {tab === 'plan' && (
        <div className="space-y-2">
          {steps.length === 0 && <p className="text-xs text-gray-500">No steps recorded.</p>}
          {steps.map((s, i) => (
            <div key={i} className="flex items-start gap-3 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
              <div className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                s.done ? 'border-blue-500 bg-blue-500' : 'border-gray-600'
              }`}>
                {s.done && <span className="text-white text-xs">✓</span>}
              </div>
              <div>
                <p className={`text-sm ${s.done ? 'text-gray-400 line-through' : 'text-white'}`}>{s.step}</p>
                {s.time && <p className="text-xs text-gray-500 mt-0.5">{s.time}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: My Logs */}
      {tab === 'logs' && (
        <div className="space-y-2">
          {logs.length === 0 && <p className="text-xs text-gray-500">No logs recorded.</p>}
          {logs.map(log => (
            <div key={log.id} className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 space-y-1">
              <p className="text-xs text-gray-500">{log.date}</p>
              <p className="text-sm text-gray-300">{log.notes}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Media */}
      {tab === 'media' && (
        <div className="space-y-2">
          {logs.every(l => (!l.photo_urls || l.photo_urls.length === 0) && !l.video_url) ? (
            <p className="text-xs text-gray-500">No media attached.</p>
          ) : (
            logs.map(log => (
              <div key={log.id}>
                {(log.photo_urls || []).map((url, i) => (
                  <img key={i} src={url} alt="session" className="w-full rounded-xl border border-gray-700 mb-2" />
                ))}
                {log.video_url && (
                  <div className="bg-gray-800 border border-gray-700 rounded-xl p-3">
                    <a href={log.video_url} target="_blank" rel="noreferrer" className="text-sm text-blue-400 underline">
                      🎥 {log.video_url}
                    </a>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Resources */}
      {tab === 'resources' && (
        <div className="space-y-2">
          {resources.length === 0 && <p className="text-xs text-gray-500">No resources saved.</p>}
          {resources.map((r, i) => (
            <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 uppercase">{r.type}</span>
                <p className="text-sm text-white">{r.title}</p>
              </div>
              {r.url && (
                <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 underline break-all">
                  {r.url}
                </a>
              )}
            </div>
          ))}
          {entry.ai_notes && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">AI Concept Note</p>
              <p className="text-sm text-gray-300 italic">{entry.ai_notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Footer buttons */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={() => alert('Revision coming soon.')}
          className={`flex-1 border px-4 py-2.5 rounded-lg text-sm font-medium ${
            entry.needs_review
              ? 'border-amber-500 text-amber-400 hover:bg-amber-500/10'
              : 'border-gray-700 text-gray-400 hover:text-white'
          }`}
        >
          🔄 Revise
        </button>
        <button
          onClick={() => alert('Go Deeper coming soon.')}
          className="flex-1 border border-gray-700 text-gray-400 hover:text-white px-4 py-2.5 rounded-lg text-sm font-medium"
        >
          🔍 Go Deeper
        </button>
      </div>
    </div>
  )
}
