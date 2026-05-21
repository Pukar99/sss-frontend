import { useState } from 'react'
import { saveTrade } from '../../api/index'
import MediaUpload from '../shared/MediaUpload'
import toast from 'react-hot-toast'

const SYMBOLS = ['XAUUSD', 'NEPSE Stock', 'Other']
const EMOTIONS = ['calm', 'anxious', 'fomo', 'confident', 'revenge']

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function TradeJournal({ onSaved, onBack }) {
  const [form, setForm] = useState({
    symbol: 'XAUUSD',
    customSymbol: '',
    direction: 'long',
    entry_price: '',
    exit_price: '',
    result: 'open',
    pnl: '',
    reason: '',
    what_happened: '',
    emotion: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const symbol = form.symbol === 'Other' ? form.customSymbol.trim() : form.symbol
      if (!symbol) { setError('Please enter a symbol.'); setSaving(false); return }

      await saveTrade({
        date: today(),
        symbol,
        direction: form.direction,
        entry_price: form.entry_price || null,
        exit_price: form.exit_price || null,
        result: form.result,
        pnl: form.pnl || null,
        reason: form.reason || null,
        what_happened: form.what_happened || null,
        emotion: form.emotion || null,
        screenshot_url: form.screenshot_url || null,
      })
      toast.success('Trade saved')
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
        <h2 className="text-base font-semibold text-white">Trade Journal</h2>
      </div>

      {/* Symbol */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">
          Symbol
        </label>
        <div className="flex gap-2 flex-wrap">
          {SYMBOLS.map((s) => (
            <button
              key={s} type="button"
              onClick={() => set('symbol', s)}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                form.symbol === s ? 'bg-amber-500 text-white' : 'bg-gray-700 text-gray-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        {form.symbol === 'Other' && (
          <input
            type="text"
            value={form.customSymbol}
            onChange={(e) => set('customSymbol', e.target.value)}
            placeholder="Enter symbol"
            className="mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
          />
        )}
      </div>

      {/* Direction */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">
          Direction
        </label>
        <div className="flex gap-2">
          {['long', 'short'].map((d) => (
            <button
              key={d} type="button"
              onClick={() => set('direction', d)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize ${
                form.direction === d ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Prices */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">
            Entry Price
          </label>
          <input
            type="number" step="any" value={form.entry_price}
            onChange={(e) => set('entry_price', e.target.value)}
            placeholder="Optional"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">
            Exit Price
          </label>
          <input
            type="number" step="any" value={form.exit_price}
            onChange={(e) => set('exit_price', e.target.value)}
            placeholder="Optional"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
          />
        </div>
      </div>

      {/* Result */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">
          Result
        </label>
        <div className="flex gap-2">
          {[{ v: 'win', label: 'Win' }, { v: 'loss', label: 'Loss' }, { v: 'open', label: 'Still Open' }].map((r) => (
            <button
              key={r.v} type="button"
              onClick={() => set('result', r.v)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                form.result === r.v ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* P&L */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">
          P&amp;L
        </label>
        <input
          type="number" step="any" value={form.pnl}
          onChange={(e) => set('pnl', e.target.value)}
          placeholder="Optional"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
        />
      </div>

      {/* Reason */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">
          Why I took this trade
        </label>
        <textarea
          value={form.reason}
          onChange={(e) => set('reason', e.target.value)}
          rows={3}
          placeholder="Setup, confluence, rationale..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 resize-none"
        />
      </div>

      {/* What happened */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">
          What happened
        </label>
        <textarea
          value={form.what_happened}
          onChange={(e) => set('what_happened', e.target.value)}
          rows={3}
          placeholder="How it played out, what you noticed..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 resize-none"
        />
      </div>

      {/* Emotion */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">
          Emotion
        </label>
        <div className="flex gap-2 flex-wrap">
          {EMOTIONS.map((em) => (
            <button
              key={em} type="button"
              onClick={() => set('emotion', form.emotion === em ? '' : em)}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                form.emotion === em ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
              }`}
            >
              {em}
            </button>
          ))}
        </div>
      </div>

      {/* Screenshot */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">
          Screenshot
        </label>
        <MediaUpload label="📷 Attach" onUploaded={(url) => set('screenshot_url', url)} />
        {form.screenshot_url && (
          <div className="mt-2">
            <img src={form.screenshot_url} alt="screenshot" className="w-full rounded-xl border border-gray-700 max-h-48 object-cover" />
            <button type="button" onClick={() => set('screenshot_url', '')} className="text-xs text-red-400 mt-1">Remove</button>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
      >
        {saving ? 'Saving...' : 'Save Trade'}
      </button>
    </form>
  )
}
