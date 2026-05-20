import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/shared/BottomNav'

function getGreeting() {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Good morning, Pukar.'
  if (h >= 12 && h < 17) return 'Good afternoon, Pukar.'
  if (h >= 17 && h < 22) return 'Good evening, Pukar.'
  return 'Still up, Pukar.'
}

const blocks = [
  {
    type: 'stock',
    label: 'Stock',
    icon: '🟡',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    logPath: '/log?type=stock',
  },
  {
    type: 'skill',
    label: 'Skill',
    icon: '🔵',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    logPath: '/log?type=skill',
  },
  {
    type: 'study',
    label: 'Study',
    icon: '🟣',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    logPath: '/log?type=study',
  },
]

export default function HomePage() {
  const navigate = useNavigate()

  // Placeholder — will be replaced with real data from backend
  const loggedToday = { stock: false, skill: false, study: false }

  const allDone = Object.values(loggedToday).every(Boolean)

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-4 pb-24 max-w-lg mx-auto">

      {/* Greeting */}
      <h1 className="text-base font-semibold text-white mb-1">{getGreeting()}</h1>

      {/* Today's blocks */}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 mt-6">
        Today
      </p>

      <div className="space-y-2">
        {blocks.map((b) => {
          const done = loggedToday[b.type]
          return (
            <div
              key={b.type}
              className={`flex items-center justify-between rounded-xl p-4 border ${b.bg} ${b.border}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-base leading-none">{b.icon}</span>
                <div>
                  <p className={`text-sm font-medium ${b.color}`}>{b.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {done ? 'Logged ✅' : 'Not logged'}
                  </p>
                </div>
              </div>
              {!done && (
                <button
                  onClick={() => navigate(b.logPath)}
                  className="text-xs font-medium text-gray-400 hover:text-white border border-gray-700 px-3 py-1.5 rounded-lg"
                >
                  + Log
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* AI Alignment Score — shown when all 3 done */}
      {allDone && (
        <button
          onClick={() => {}}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
        >
          Get AI Alignment Score →
        </button>
      )}

      <BottomNav />
    </div>
  )
}
