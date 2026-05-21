import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { getProgressLogs, saveProgressLog, updateLearningEntry, uploadVideo } from '../../api/index'
import MediaUpload from '../shared/MediaUpload'
import YouTubeEmbed from '../shared/YouTubeEmbed'
import toast from 'react-hot-toast'

function today() { return new Date().toISOString().slice(0, 10) }

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function ProgressPhase({ entry, type, onSaved, onMarkComplete, onBack }) {
  const [logs, setLogs] = useState([])
  const [notes, setNotes] = useState('')
  const [photoUrls, setPhotoUrls] = useState([])
  const [videoUrl, setVideoUrl] = useState('')
  const [videoUploading, setVideoUploading] = useState(false)
  const videoInputRef = useRef(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [expandedLog, setExpandedLog] = useState(null)
  const [confirmComplete, setConfirmComplete] = useState(false)
  const [activeSection, setActiveSection] = useState('plan') // 'plan' | 'log'

  const isSkill = type === 'skill'
  const accent = isSkill ? 'bg-blue-600 hover:bg-blue-500' : 'bg-purple-600 hover:bg-purple-500'
  const accentText = isSkill ? 'text-blue-400' : 'text-purple-400'
  const accentFill = isSkill ? 'bg-blue-500' : 'bg-purple-500'
  const accentBorder = isSkill ? 'border-blue-500/30' : 'border-purple-500/30'
  const accentBg = isSkill ? 'bg-blue-500/5' : 'bg-purple-500/5'

  const steps = useMemo(() => entry.plan_steps || [], [entry.plan_steps])
  const [checkedSteps, setCheckedSteps] = useState(() =>
    (entry.plan_steps || []).map(s => s.done || false)
  )

  const fetchLogs = useCallback(async () => {
    try { setLogs(await getProgressLogs(entry.id)) }
    catch (_) { setLogs([]) }
  }, [entry.id])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  function toggleStep(i) {
    setCheckedSteps(prev => { const n = [...prev]; n[i] = !n[i]; return n })
  }

  async function handleLogToday() {
    if (!notes.trim()) return
    setSaving(true); setError('')
    try {
      const updatedSteps = steps.map((s, i) => ({ ...s, done: checkedSteps[i] }))
      await updateLearningEntry(entry.id, { plan_steps: updatedSteps })
      await saveProgressLog({ entry_id: entry.id, date: today(), notes: notes.trim(), photo_urls: photoUrls, video_url: videoUrl || null })
      setNotes(''); setPhotoUrls([]); setVideoUrl('')
      await fetchLogs()
      toast.success('Session logged')
      onSaved()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function handleMarkComplete() {
    setSaving(true); setError('')
    try {
      const updatedSteps = steps.map((s, i) => ({ ...s, done: checkedSteps[i] }))
      await updateLearningEntry(entry.id, { plan_steps: updatedSteps })
      onMarkComplete({ ...entry, plan_steps: updatedSteps })
    } catch (err) { setError(err.message); setSaving(false) }
  }

  const doneCount = checkedSteps.filter(Boolean).length
  const pct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="text-gray-600 hover:text-gray-300 text-sm">← Back</button>
        <span className={`text-xs font-semibold uppercase tracking-widest ${accentText}`}>In Progress</span>
      </div>

      {/* Mission title + progress */}
      <div className={`${accentBg} border ${accentBorder} rounded-2xl p-4 space-y-3`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={`text-base font-bold text-white leading-snug`}>{entry.title}</p>
            <p className="text-xs text-gray-600 mt-0.5">{doneCount}/{steps.length} steps · {logs.length} session{logs.length !== 1 ? 's' : ''}</p>
          </div>
          <span className={`text-sm font-bold font-mono ${accentText} shrink-0`}>{pct}%</span>
        </div>
        {steps.length > 0 && (
          <div className="h-1 bg-surface2 rounded-full overflow-hidden">
            <div className={`h-1 ${accentFill} rounded-full transition-all duration-500`}
              style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>

      {/* Section tabs */}
      <div className="flex bg-surface border border-border rounded-2xl p-1 gap-1">
        <button
          onClick={() => setActiveSection('plan')}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeSection === 'plan' ? 'bg-surface2 text-white' : 'text-gray-600 hover:text-gray-400'
          }`}
        >
          Mission Plan
        </button>
        <button
          onClick={() => setActiveSection('log')}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeSection === 'log' ? 'bg-surface2 text-white' : 'text-gray-600 hover:text-gray-400'
          }`}
        >
          Today's Log {logs.length > 0 && <span className="ml-1 text-gray-600">({logs.length})</span>}
        </button>
      </div>

      {/* Plan section */}
      {activeSection === 'plan' && (
        <div className="space-y-4 animate-fade-in">
          {steps.length === 0 && (
            <p className="text-xs text-gray-700 text-center py-6">No steps in this mission.</p>
          )}

          <div className="space-y-2">
            {steps.map((s, i) => (
              <button
                key={i}
                onClick={() => toggleStep(i)}
                className={`w-full flex items-start gap-3 rounded-2xl px-4 py-3.5 text-left transition-all border ${
                  checkedSteps[i]
                    ? `bg-surface border-border opacity-60`
                    : `bg-surface border-border hover:border-border2`
                }`}
              >
                {/* Checkbox */}
                <div className={`mt-0.5 w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-all ${
                  checkedSteps[i]
                    ? `${accentFill} border-transparent`
                    : 'border-border2 bg-transparent'
                }`}>
                  {checkedSteps[i] && <CheckIcon />}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm leading-snug transition-all ${
                    checkedSteps[i] ? 'text-gray-600 line-through' : 'text-gray-200'
                  }`}>
                    {s.step}
                  </p>
                  {s.time && !checkedSteps[i] && (
                    <span className="inline-block mt-1 text-xs text-gray-700 bg-surface2 px-2 py-0.5 rounded-lg">{s.time}</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Resources */}
          {(entry.resources || []).length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-widest mb-2">Resources</p>
              <div className="flex flex-wrap gap-2">
                {entry.resources.map((r, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-surface border border-border rounded-xl px-3 py-1.5">
                    <span className="text-xs text-gray-400">{r.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI notes */}
          {entry.ai_notes && (
            <div className="bg-surface border border-border rounded-2xl p-4">
              <p className="text-xs font-medium text-gray-600 uppercase tracking-widest mb-1.5">AI Briefing</p>
              <p className="text-sm text-gray-500 italic leading-relaxed">{entry.ai_notes}</p>
            </div>
          )}

          {/* Mark complete */}
          {!confirmComplete ? (
            <button
              onClick={() => setConfirmComplete(true)}
              className="w-full text-gray-600 hover:text-gray-300 border border-border hover:border-border2 py-3 rounded-2xl text-sm font-medium transition-colors"
            >
              Mission Complete →
            </button>
          ) : (
            <div className={`${accentBg} border ${accentBorder} rounded-2xl p-4 space-y-3`}>
              <p className="text-sm font-semibold text-white">Ready to close this mission?</p>
              <p className="text-xs text-gray-600">You'll go through a quick AI debrief before the knowledge card is created.</p>
              <div className="flex gap-2">
                <button onClick={handleMarkComplete} disabled={saving}
                  className={`flex-1 ${accent} disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-bold`}>
                  {saving ? 'Saving...' : 'Yes, debrief me'}
                </button>
                <button onClick={() => setConfirmComplete(false)}
                  className="flex-1 bg-surface border border-border text-gray-500 hover:text-white py-2.5 rounded-xl text-sm transition-colors">
                  Not yet
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Log section */}
      {activeSection === 'log' && (
        <div className="space-y-4 animate-fade-in">

          {/* Today's entry */}
          <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-widest">What did you do today?</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={5}
              placeholder="Progress made, blockers hit, things learned, next steps..."
              className="w-full bg-base border border-border rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-700 focus:outline-none focus:border-border2 resize-none leading-relaxed"
            />

            {/* Photo thumbnails */}
            {photoUrls.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {photoUrls.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt="upload" className="h-16 w-16 object-cover rounded-xl border border-border" />
                    <button type="button"
                      onClick={() => setPhotoUrls(prev => prev.filter((_, j) => j !== i))}
                      className="absolute -top-1 -right-1 bg-base text-red-400 text-xs rounded-full w-4 h-4 flex items-center justify-center border border-border">✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Video embed */}
            {videoUrl && <YouTubeEmbed url={videoUrl} onRemove={() => setVideoUrl('')} />}

            {/* Media buttons */}
            <div className="flex gap-2 flex-wrap">
              <MediaUpload label="📷 Photo" multiple onUploaded={url => setPhotoUrls(prev => [...prev, url])} />
              <input ref={videoInputRef} type="file" accept="video/*" className="hidden"
                onChange={async e => {
                  const file = e.target.files?.[0]; if (!file) return
                  setVideoUploading(true); setError('')
                  try {
                    const result = await uploadVideo(file)
                    if (result.url) setVideoUrl(result.url)
                    else throw new Error(result.error || 'Upload failed')
                  } catch (err) { setError(err.message) }
                  finally { setVideoUploading(false); if (videoInputRef.current) videoInputRef.current.value = '' }
                }} />
              <button type="button" disabled={videoUploading}
                onClick={() => videoInputRef.current?.click()}
                className="text-gray-600 hover:text-gray-300 disabled:opacity-50 border border-border px-3 py-1.5 rounded-xl text-xs transition-colors">
                {videoUploading ? 'Uploading...' : '🎥 Video'}
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button onClick={handleLogToday} disabled={saving || !notes.trim()}
            className={`w-full ${accent} disabled:opacity-30 text-white py-3.5 rounded-2xl text-sm font-bold transition-all`}>
            {saving ? 'Saving...' : 'Log Session →'}
          </button>

          {/* Past logs */}
          {logs.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-widest mb-2.5">Session History</p>
              <div className="space-y-2">
                {logs.map(log => (
                  <div key={log.id} className="bg-surface border border-border rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-1 h-1 rounded-full ${accentFill}`} />
                        <span className="text-xs text-gray-500">{log.date}</span>
                        {log.notes && (
                          <span className="text-xs text-gray-700 truncate max-w-[160px]">{log.notes.slice(0, 40)}...</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-700">{expandedLog === log.id ? '▲' : '▼'}</span>
                    </button>
                    {expandedLog === log.id && (
                      <div className="px-4 pb-4 border-t border-border space-y-3">
                        <p className="text-sm text-gray-300 mt-3 leading-relaxed">{log.notes}</p>
                        {(log.photo_urls || []).length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {log.photo_urls.map((url, i) => (
                              <img key={i} src={url} alt="" className="h-20 w-20 object-cover rounded-xl border border-border" />
                            ))}
                          </div>
                        )}
                        {log.video_url && <YouTubeEmbed url={log.video_url} />}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
