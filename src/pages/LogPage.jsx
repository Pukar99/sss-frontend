import { useSearchParams, useNavigate } from 'react-router-dom'
import StockEntry from '../components/stock/StockEntry'
import SkillEntry from '../components/skill/SkillEntry'
import BottomNav from '../components/shared/BottomNav'

export default function LogPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const type = params.get('type') // 'stock' | 'skill' | 'study'

  function handleSaved() {
    navigate('/home')
  }

  function renderContent() {
    if (type === 'stock') {
      return <StockEntry onSaved={handleSaved} />
    }
    if (type === 'skill' || type === 'study') {
      return <SkillEntry type={type} onSaved={handleSaved} />
    }
    // No type param — show chooser
    return (
      <div className="space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          What would you like to log?
        </p>
        <div className="flex gap-3">
          {[
            { type: 'stock', icon: '🟡', label: 'Stock' },
            { type: 'skill', icon: '🔵', label: 'Skill' },
            { type: 'study', icon: '🟣', label: 'Study' },
          ].map((b) => (
            <button
              key={b.type}
              onClick={() => navigate(`/log?type=${b.type}`)}
              className="flex-1 flex flex-col items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl py-5 text-sm font-medium text-white"
            >
              <span className="text-xl">{b.icon}</span>
              {b.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-4 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/home')} className="text-gray-400 hover:text-white text-sm">
          ← Home
        </button>
        <h1 className="text-base font-semibold text-white">Log</h1>
      </div>

      {renderContent()}

      <BottomNav />
    </div>
  )
}
