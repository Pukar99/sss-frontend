import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { getProgressLogs, saveProgressLog, updateLearningEntry, uploadVideo } from '../../api/index'
import PhaseIndicator from '../shared/PhaseIndicator'
import MediaUpload from '../shared/MediaUpload'
import YouTubeEmbed from '../shared/YouTubeEmbed'
import toast from 'react-hot-toast'

function today() {
  return new Date().toISOString().slice(0, 10)
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

  const accent = type === 'skill' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-purple-600 hover:bg-purple-500'
  const color = type === 'skill' ? 'text-blue-400' : 'text-purple-400'

  const steps = useMemo(() => entry.plan_steps || [], [entry.plan_steps])
  const [checkedSteps, setCheckedSteps] = useState(() =>
    (entry.plan_steps || []).map(s => s.done || false)
  )

  const fetchLogs = useCallback(async () => {
    try {
      const data = await getProgressLogs(entry.id)
      setLogs(data)
    } catch (_) {
      setLogs([])
    }
  }, [entry.id])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  function toggleStep(i) {
    setCheckedSteps(prev => {
      const next = [...prev]
      next[i] = !next[i]
      return next
    })
  }

  async function handleLogToday() {
    if (!notes.trim()) return
    setSaving(true)
    setError('')
    try {
      // Save updated steps to entry
      const updatedSteps = steps.map((s, i) => ({ ...s, done: checkedSteps[i] }))
      await updateLearningEntry(entry.id, { plan_steps: updatedSteps })

      await saveProgressLog({
        entry_id: entry.id,
        date: today(),
        notes: notes.trim(),
        photo_urls: photoUrls,
        video_url: videoUrl || null,
      })
      setNotes('')
      setPhotoUrls([])
      setVideoUrl('')
      await fetchLogs()
      toast.success('Session logged')
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleMarkComplete() {
    setSaving(true)
    setError('')
    try {
      // Save final step state before going to assessment
      const updatedSteps = steps.map((s, i) => ({ ...s, done: checkedSteps[i] }))
      await updateLearningEntry(entry.id, { plan_steps: updatedSteps })
      onMarkComplete({ ...entry, plan_steps: updatedSteps })
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  const doneCount = checkedSteps.filter(Boolean).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="text-gray-400 hover:text-white text-sm">
          ← Back
        </button>
        <PhaseIndicator phase={2} />
      </div>

      <div>
        <p className={`text-sm font-semibold ${color}`}>{entry.title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{doneCount}/{steps.length} steps done</p>
      </div>

      {/* Progress bar */}
      {steps.length > 0 && (
        <div className="h-1.5 bg-gray-700 rounded-full">
          <div
            className="h-1.5 bg-blue-500 rounded-full transition-all"
            style={{ width: `${steps.length ? (doneCount / steps.length) * 100 : 0}%` }}
          />
        </div>
      )}

      {/* Plan steps */}
      {steps.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Steps</p>
          <div className="space-y-2">
            {steps.map((s, i) => (
              <button
                key={i}
                onClick={() => toggleStep(i)}
                className={`w-full flex items-start gap-3 bg-gray-800 border rounded-xl px-4 py-3 text-left transition-colors ${
                  checkedSteps[i] ? 'border-blue-500/30' : 'border-gray-700'
                }`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                  checkedSteps[i] ? 'border-blue-500 bg-blue-500' : 'border-gray-600'
                }`}>
                  {checkedSteps[i] && <span className="text-white text-xs">✓</span>}
                </div>
                <div>
                  <p className={`text-sm ${checkedSteps[i] ? 'text-gray-500 line-through' : 'text-white'}`}>
                    {s.step}
                  </p>
                  {s.time && <p className="text-xs text-gray-500 mt-0.5">{s.time}</p>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Today's log */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          What did you do today?
        </p>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={4}
          placeholder="Notes, progress, blockers, insights..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 resize-none"
        />
        <div className="flex gap-2 mt-2 flex-wrap">
          <MediaUpload
            label="📷 Photo"
            multiple
            onUploaded={(url) => setPhotoUrls(prev => [...prev, url])}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              setVideoUploading(true)
              setError('')
              try {
                const result = await uploadVideo(file)
                if (result.url) setVideoUrl(result.url)
                else throw new Error(result.error || 'Upload failed')
              } catch (err) {
                setError(err.message)
              } finally {
                setVideoUploading(false)
                if (videoInputRef.current) videoInputRef.current.value = ''
              }
            }}
          />
          <button
            type="button"
            disabled={videoUploading}
            onClick={() => videoInputRef.current?.click()}
            className="text-gray-400 hover:text-white disabled:opacity-50 border border-gray-700 px-3 py-1.5 rounded-lg text-xs"
          >
            {videoUploading ? 'Uploading...' : '🎥 Video'}
          </button>
          {videoUrl && (
            <YouTubeEmbed url={videoUrl} onRemove={() => setVideoUrl('')} />
          )}
        </div>
        {photoUrls.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-2">
            {photoUrls.map((url, i) => (
              <div key={i} className="relative">
                <img src={url} alt="upload" className="h-16 w-16 object-cover rounded-lg border border-gray-700" />
                <button
                  type="button"
                  onClick={() => setPhotoUrls(prev => prev.filter((_, j) => j !== i))}
                  className="absolute -top-1 -right-1 bg-gray-900 text-red-400 text-xs rounded-full w-4 h-4 flex items-center justify-center"
                >✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        onClick={handleLogToday}
        disabled={saving || !notes.trim()}
        className={`w-full ${accent} disabled:opacity-40 text-white px-4 py-2.5 rounded-lg text-sm font-medium`}
      >
        {saving ? 'Saving...' : 'Log Today →'}
      </button>

      {/* Past logs */}
      {logs.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Past Logs</p>
          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <span className="text-xs text-gray-400">{log.date}</span>
                  <span className="text-xs text-gray-600">{expandedLog === log.id ? '▲' : '▼'}</span>
                </button>
                {expandedLog === log.id && (
                  <div className="px-4 pb-3 border-t border-gray-700">
                    <p className="text-sm text-gray-300 mt-2">{log.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mark complete */}
      {!confirmComplete ? (
        <button
          onClick={() => setConfirmComplete(true)}
          className="w-full text-gray-400 hover:text-white border border-gray-700 px-4 py-2.5 rounded-lg text-sm"
        >
          Mark Complete →
        </button>
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
          <p className="text-sm text-white">Mark this mission as complete?</p>
          <p className="text-xs text-gray-500">You'll move to the assessment phase next session.</p>
          <div className="flex gap-2">
            <button
              onClick={handleMarkComplete}
              disabled={saving}
              className={`flex-1 ${accent} disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium`}
            >
              {saving ? 'Saving...' : 'Yes, complete'}
            </button>
            <button
              onClick={() => setConfirmComplete(false)}
              className="flex-1 text-gray-400 hover:text-white border border-gray-700 px-4 py-2 rounded-lg text-sm"
            >
              Not yet
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
