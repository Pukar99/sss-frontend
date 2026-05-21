import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/shared/BottomNav'

function getGreeting() {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Good morning, Pukar.'
  if (h >= 12 && h < 17) return 'Good afternoon, Pukar.'
  if (h >= 17 && h < 22) return 'Good evening, Pukar.'
  return 'Still up, Pukar.'
}

function getDate() {
  return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

const blocks = [
  {
    type: 'stock',
    label: 'Stock',
    description: 'Trade journal · Research',
    dot: 'bg-amber-400',
    color: 'text-amber-400',
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/20',
    activeBorder: 'border-amber-500/40',
    logPath: '/log?type=stock',
  },
  {
    type: 'skill',
    label: 'Skill',
    description: 'Plan · Progress · Master',
    dot: 'bg-blue-400',
    color: 'text-blue-400',
    bg: 'bg-blue-500/5',
    border: 'border-blue-500/20',
    activeBorder: 'border-blue-500/40',
    logPath: '/log?type=skill',
  },
  {
    type: 'study',
    label: 'Study',
    description: 'Read · Learn · Retain',
    dot: 'bg-purple-400',
    color: 'text-purple-400',
    bg: 'bg-purple-500/5',
    border: 'border-purple-500/20',
    activeBorder: 'border-purple-500/40',
    logPath: '/log?type=study',
  },
]

export default function HomePage() {
  const navigate = useNavigate()

  // Placeholder — will be replaced with real data from backend
  const loggedToday = { stock: false, skill: false, study: false }
  const allDone = Object.values(loggedToday).every(Boolean)
  const doneCount = Object.values(loggedToday).filter(Boolean).length

  return (
    <div className="min-h-screen bg-gray-900 px-4 pb-24 max-w-lg mx-auto">

      {/* Header */}
      <div className="pt-8 pb-6">
        <p className="text-xs text-gray-500 mb-1">{getDate()}</p>
        <h1 className="text-xl font-semibold text-white tracking-tight">{getGreeting()}</h1>
        <p className="text-xs text-gray-500 mt-1">
          {doneCount === 0 ? 'Nothing logged yet today.' : doneCount === 3 ? 'All 3 blocks done.' : `${doneCount}/3 blocks logged.`}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${(doneCount / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Today's blocks */}
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Today</p>

      <div className="space-y-2">
        {blocks.map((b) => {
          const done = loggedToday[b.type]
          return (
            <div
              key={b.type}
              className={`flex items-center justify-between rounded-2xl px-4 py-3.5 border transition-colors ${
                done ? `${b.bg} ${b.activeBorder}` : `bg-gray-800/60 ${b.border}`
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${done ? b.dot : 'bg-gray-600'} shrink-0`} />
                <div>
                  <p className={`text-sm font-semibold ${done ? b.color : 'text-gray-300'}`}>
                    {b.label}
                    {done && <span className="ml-2 text-xs font-normal">✓</span>}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{b.description}</p>
                </div>
              </div>
              {!done ? (
                <button
                  onClick={() => navigate(b.logPath)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${b.color} border-current opacity-60 hover:opacity-100`}
                >
                  + Log
                </button>
              ) : (
                <button
                  onClick={() => navigate(b.logPath)}
                  className="text-xs text-gray-500 hover:text-gray-300"
                >
                  View →
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* AI Alignment Score */}
      {allDone && (
        <button
          onClick={() => {}}
          className="w-full mt-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-3 rounded-2xl text-sm font-medium transition-all"
        >
          Get AI Alignment Score →
        </button>
      )}

      <BottomNav />
    </div>
  )
}
