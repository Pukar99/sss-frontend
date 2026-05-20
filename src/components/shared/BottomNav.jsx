import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const tabs = [
  { label: 'Home', icon: '🏠', path: '/home' },
  { label: 'Log', icon: '📋', path: null },
  { label: 'Library', icon: '📚', path: '/library' },
  { label: 'Weekly', icon: '📅', path: '/weekly' },
]

const logChoices = [
  { label: 'Stock', icon: '🟡', path: '/log?type=stock' },
  { label: 'Skill', icon: '🔵', path: '/log?type=skill' },
  { label: 'Study', icon: '🟣', path: '/log?type=study' },
]

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

  const active = (path) =>
    path && location.pathname === path

  return (
    <>
      {/* Log chooser sheet */}
      {showChooser && (
        <div
          className="fixed inset-0 z-40 flex items-end"
          onClick={() => setShowChooser(false)}
        >
          <div
            className="w-full bg-gray-800 border-t border-gray-700 px-4 pt-4 pb-8 rounded-t-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
              What would you like to log?
            </p>
            <div className="flex gap-3">
              {logChoices.map((c) => (
                <button
                  key={c.label}
                  onClick={() => handleLogChoice(c.path)}
                  className="flex-1 flex flex-col items-center gap-2 bg-gray-700 hover:bg-gray-600 rounded-xl py-4 text-sm font-medium text-white"
                >
                  <span className="text-xl">{c.icon}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-30">
        <div className="flex max-w-lg mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => handleTab(tab)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                active(tab.path) ? 'text-white' : 'text-gray-500'
              }`}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
    </>
  )
}
