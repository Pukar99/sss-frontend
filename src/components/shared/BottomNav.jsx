import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const tabs = [
  { label: 'Home', path: '/home', icon: HomeIcon },
  { label: 'Log', path: null, icon: LogIcon },
  { label: 'Library', path: '/library', icon: LibraryIcon },
  { label: 'Weekly', path: '/weekly', icon: WeeklyIcon },
]

const logChoices = [
  { label: 'Stock', dot: 'bg-amber-400', color: 'text-amber-400', path: '/log?type=stock' },
  { label: 'Skill', dot: 'bg-blue-400', color: 'text-blue-400', path: '/log?type=skill' },
  { label: 'Study', dot: 'bg-purple-400', color: 'text-purple-400', path: '/log?type=study' },
]

function HomeIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'white' : 'none'} stroke={active ? 'white' : '#6b7280'} strokeWidth="1.8">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  )
}

function LogIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : '#6b7280'} strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4l3 3" strokeLinecap="round" />
    </svg>
  )
}

function LibraryIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : '#6b7280'} strokeWidth="1.8">
      <path d="M4 19V5a2 2 0 012-2h12a2 2 0 012 2v14" strokeLinecap="round" />
      <path d="M4 19a2 2 0 002 2h12a2 2 0 002-2" />
      <path d="M9 7h6M9 11h6M9 15h4" strokeLinecap="round" />
    </svg>
  )
}

function WeeklyIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : '#6b7280'} strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" strokeLinecap="round" strokeWidth="2.5" />
    </svg>
  )
}

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showChooser, setShowChooser] = useState(false)

  function handleTab(tab) {
    if (tab.path === null) {
      setShowChooser(true)
    } else {
      navigate(tab.path)
    }
  }

  function handleLogChoice(path) {
    setShowChooser(false)
    navigate(path)
  }

  const isActive = (path) => path && location.pathname === path

  return (
    <>
      {/* Backdrop */}
      {showChooser && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-end" onClick={() => setShowChooser(false)}>
          <div
            className="w-full bg-gray-900 border-t border-gray-800 px-4 pt-5 pb-10 rounded-t-3xl max-w-lg mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-5" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4 text-center">
              Log today's block
            </p>
            <div className="flex gap-3">
              {logChoices.map((c) => (
                <button
                  key={c.label}
                  onClick={() => handleLogChoice(c.path)}
                  className="flex-1 flex flex-col items-center gap-3 bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-600 rounded-2xl py-5 transition-colors"
                >
                  <div className={`w-3 h-3 rounded-full ${c.dot}`} />
                  <span className={`text-sm font-semibold ${c.color}`}>{c.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-gray-900/95 backdrop-blur-md border-t border-gray-800">
        <div className="flex max-w-lg mx-auto">
          {tabs.map((tab) => {
            const active = isActive(tab.path)
            const Icon = tab.icon
            return (
              <button
                key={tab.label}
                onClick={() => handleTab(tab)}
                className="flex-1 flex flex-col items-center gap-1.5 py-3 transition-colors"
              >
                <Icon active={active} />
                <span className={`text-xs font-medium transition-colors ${active ? 'text-white' : 'text-gray-500'}`}>
                  {tab.label}
                </span>
                {active && <div className="w-1 h-1 rounded-full bg-white absolute bottom-1.5" />}
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
