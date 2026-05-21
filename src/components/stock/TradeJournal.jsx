import { useState } from 'react'
import { saveTrade } from '../../api/index'
import MediaUpload from '../shared/MediaUpload'
import toast from 'react-hot-toast'

const SYMBOLS = ['XAUUSD', 'NEPSE Stock', 'Other']
const EMOTIONS = [
  { v: 'calm', emoji: '😌' },
  { v: 'confident', emoji: '💪' },
  { v: 'anxious', emoji: '😰' },
  { v: 'fomo', emoji: '😤' },
  { v: 'revenge', emoji: '😡' },
]
const STEPS = ['Setup', 'Outcome', 'Reflection', 'Evidence']

function today() { return new Date().toISOString().slice(0, 10) }

function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${
            i < current ? 'bg-amber-400' : i === current ? 'bg-amber-400/60' : 'bg-gray-800'
          }`}
        />
      ))}
    </div>
  )
}

function FieldLabel({ children }) {
  return <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-2.5">{children}</p>
}

function Chip({ active, onClick, children, color = 'amber' }) {
  const colors = {
    amber: active ? 'bg-amber-500 text-white border-amber-500' : 'bg-transparent text-gray-500 border-border',
    blue: active ? 'bg-blue-600 text-white border-blue-600' : 'bg-transparent text-gray-500 border-border',
    green: active ? 'bg-green-600 text-white border-green-600' : 'bg-transparent text-gray-500 border-border',
    red: active ? 'bg-red-600 text-white border-red-600' : 'bg-transparent text-gray-500 border-border',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${colors[color]}`}
    >
      {children}
    </button>
  )
}

function NumberInput({ value, onChange, placeholder }) {
  return (
    <input
      type="number"
      step="any"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-gray-700 focus:outline-none focus:border-border2"
    />
  )
}

function TextArea({ value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-gray-300 placeholder-gray-700 focus:outline-none focus:border-border2 resize-none leading-relaxed"
    />
  )
}

export default function TradeJournal({ onSaved, onBack }) {
  const [step, setStep] = useState(0)
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
    screenshot_url: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }

  function canNext() {
    if (step === 0) {
      const sym = form.symbol === 'Other' ? form.customSymbol.trim() : form.symbol
      return !!sym
    }
    return true
  }

  async function handleFinish() {
    setError('')
    setSaving(true)
    try {
      const symbol = form.symbol === 'Other' ? form.customSymbol.trim() : form.symbol
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
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <button type="button" onClick={step === 0 ? onBack : () => setStep(s => s - 1)} className="text-gray-600 hover:text-gray-300 text-sm">
            ← {step === 0 ? 'Back' : STEPS[step - 1]}
          </button>
          <span className="text-xs text-gray-600">{step + 1} / {STEPS.length}</span>
        </div>
        <StepIndicator current={step} total={STEPS.length} />
        <div className="mt-4">
          <p className="text-xs text-gray-600 uppercase tracking-widest mb-0.5">Trade Journal</p>
          <h2 className="text-xl font-bold text-white">{STEPS[step]}</h2>
        </div>
      </div>

      {/* Step 0: Setup */}
      {step === 0 && (
        <div className="space-y-5">
          <div>
            <FieldLabel>Symbol</FieldLabel>
            <div className="flex gap-2 flex-wrap">
              {SYMBOLS.map(s => (
                <Chip key={s} active={form.symbol === s} onClick={() => set('symbol', s)}>{s}</Chip>
              ))}
            </div>
            {form.symbol === 'Other' && (
              <input
                type="text"
                value={form.customSymbol}
                onChange={e => set('customSymbol', e.target.value)}
                placeholder="Enter symbol (e.g. NABIL)"
                autoFocus
                className="mt-3 w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-border2"
              />
            )}
          </div>

          <div>
            <FieldLabel>Direction</FieldLabel>
            <div className="flex gap-2">
              <Chip active={form.direction === 'long'} onClick={() => set('direction', 'long')} color="green">↑ Long</Chip>
              <Chip active={form.direction === 'short'} onClick={() => set('direction', 'short')} color="red">↓ Short</Chip>
            </div>
          </div>

          <div>
            <FieldLabel>Entry Price</FieldLabel>
            <NumberInput value={form.entry_price} onChange={v => set('entry_price', v)} placeholder="e.g. 2320.50" />
          </div>
        </div>
      )}

      {/* Step 1: Outcome */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <FieldLabel>Result</FieldLabel>
            <div className="flex gap-2">
              <Chip active={form.result === 'win'} onClick={() => set('result', 'win')} color="green">Win</Chip>
              <Chip active={form.result === 'loss'} onClick={() => set('result', 'loss')} color="red">Loss</Chip>
              <Chip active={form.result === 'open'} onClick={() => set('result', 'open')}>Still Open</Chip>
            </div>
          </div>

          <div>
            <FieldLabel>Exit Price</FieldLabel>
            <NumberInput value={form.exit_price} onChange={v => set('exit_price', v)} placeholder="Leave blank if open" />
          </div>

          <div>
            <FieldLabel>P&amp;L</FieldLabel>
            <NumberInput value={form.pnl} onChange={v => set('pnl', v)} placeholder="e.g. +150 or -80" />
          </div>
        </div>
      )}

      {/* Step 2: Reflection */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <FieldLabel>Why I took this trade</FieldLabel>
            <TextArea
              value={form.reason}
              onChange={v => set('reason', v)}
              placeholder="Setup, confluence, rationale... what made you pull the trigger?"
            />
          </div>

          <div>
            <FieldLabel>What happened</FieldLabel>
            <TextArea
              value={form.what_happened}
              onChange={v => set('what_happened', v)}
              placeholder="How it played out, what you noticed, what you'd do differently..."
            />
          </div>

          <div>
            <FieldLabel>Emotion</FieldLabel>
            <div className="flex gap-2 flex-wrap">
              {EMOTIONS.map(em => (
                <button
                  key={em.v}
                  type="button"
                  onClick={() => set('emotion', form.emotion === em.v ? '' : em.v)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all capitalize ${
                    form.emotion === em.v
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-transparent text-gray-500 border-border'
                  }`}
                >
                  <span>{em.emoji}</span> {em.v}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Evidence */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <FieldLabel>Chart Screenshot</FieldLabel>
            <MediaUpload label="📷 Attach screenshot" onUploaded={url => set('screenshot_url', url)} />
            {form.screenshot_url && (
              <div className="mt-3">
                <img src={form.screenshot_url} alt="chart" className="w-full rounded-2xl border border-border object-cover max-h-64" />
                <button type="button" onClick={() => set('screenshot_url', '')} className="text-xs text-red-400 mt-1.5">Remove</button>
              </div>
            )}
          </div>

          <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Summary</p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Symbol</span>
              <span className="text-white font-mono font-medium">{form.symbol === 'Other' ? form.customSymbol : form.symbol}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Direction</span>
              <span className={`font-semibold capitalize ${form.direction === 'long' ? 'text-green-400' : 'text-red-400'}`}>{form.direction}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Result</span>
              <span className={`font-semibold capitalize ${form.result === 'win' ? 'text-green-400' : form.result === 'loss' ? 'text-red-400' : 'text-amber-400'}`}>{form.result}</span>
            </div>
            {form.pnl && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">P&amp;L</span>
                <span className={`font-mono font-semibold ${parseFloat(form.pnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {parseFloat(form.pnl) >= 0 ? '+' : ''}{form.pnl}
                </span>
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep(s => s + 1)}
            disabled={!canNext()}
            className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-white py-3 rounded-2xl text-sm font-bold transition-all"
          >
            {STEPS[step + 1]} →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinish}
            disabled={saving}
            className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white py-3 rounded-2xl text-sm font-bold transition-all"
          >
            {saving ? 'Saving...' : 'Save Trade ✓'}
          </button>
        )}
      </div>
    </div>
  )
}
