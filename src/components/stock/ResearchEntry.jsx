import { useState } from 'react'
import { saveResearch } from '../../api/index'
import MediaUpload from '../shared/MediaUpload'
import toast from 'react-hot-toast'

const TYPES = [
  { v: 'strategy', label: 'Strategy' },
  { v: 'backtest', label: 'Backtest' },
  { v: 'analysis', label: 'Analysis' },
  { v: 'market_study', label: 'Market Study' },
  { v: 'other', label: 'Other' },
]

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function ResearchEntry({ onSaved, onBack }) {
  const [form, setForm] = useState({
    topic: '',
    type: 'analysis',
    what_i_did: '',
    finding: '',
    confidence: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.topic.trim()) { setError('Topic is required.'); return }
    setSaving(true)
    try {
      await saveResearch({
        date: today(),
        topic: form.topic.trim(),
        type: form.type,
        what_i_did: form.what_i_did || null,
        finding: form.finding || null,
        confidence: form.confidence || null,
        image_url: form.image_url || null,
      })
      toast.success('Research saved')
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="text-gray-400 hover:text-white text-sm">
          ← Back
        </button>
        <h2 className="text-base font-semibold text-white">Research / Backtest</h2>
      </div>

      {/* Topic */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">
          Topic
        </label>
        <input
          type="text" value={form.topic}
          onChange={(e) => set('topic', e.target.value)}
          placeholder="e.g. ICT Order Blocks on XAUUSD"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
        />
      </div>

      {/* Type */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">
          Type
        </label>
        <div className="flex gap-2 flex-wrap">
          {TYPES.map((t) => (
            <button
              key={t.v} type="button"
              onClick={() => set('type', t.v)}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                form.type === t.v ? 'bg-amber-500 text-white' : 'bg-gray-700 text-gray-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* What I did */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">
          What I did
        </label>
        <textarea
          value={form.what_i_did}
          onChange={(e) => set('what_i_did', e.target.value)}
          rows={3}
          placeholder="Describe your process, steps, observations..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 resize-none"
        />
      </div>

      {/* Finding */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">
          Finding / Conclusion
        </label>
        <textarea
          value={form.finding}
          onChange={(e) => set('finding', e.target.value)}
          rows={3}
          placeholder="Key takeaway, what you concluded..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 resize-none"
        />
      </div>

      {/* Confidence */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">
          Confidence
        </label>
        <div className="flex gap-2">
          {['low', 'medium', 'high'].map((c) => (
            <button
              key={c} type="button"
              onClick={() => set('confidence', form.confidence === c ? '' : c)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize ${
                form.confidence === c ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Attach */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">
          Attach
        </label>
        <div className="flex gap-2 flex-wrap">
          <MediaUpload label="📷 Image" onUploaded={(url) => set('image_url', url)} />
          <MediaUpload label="📊 Chart screenshot" onUploaded={(url) => set('image_url', url)} />
        </div>
        {form.image_url && (
          <div className="mt-2">
            <img src={form.image_url} alt="research" className="w-full rounded-xl border border-gray-700 max-h-48 object-cover" />
            <button type="button" onClick={() => set('image_url', '')} className="text-xs text-red-400 mt-1">Remove</button>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
      >
        {saving ? 'Saving...' : 'Save Research'}
      </button>
    </form>
  )
}
