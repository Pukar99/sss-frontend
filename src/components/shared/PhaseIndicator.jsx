// phase: 1 | 2 | 3  (Plan | Progress | Done)
export default function PhaseIndicator({ phase }) {
  const phases = ['Plan', 'Progress', 'Done']
  return (
    <div className="flex items-center gap-1">
      {phases.map((label, i) => {
        const idx = i + 1
        const active = idx === phase
        const done = idx < phase
        return (
          <div key={label} className="flex items-center gap-1">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full transition-colors ${
                done ? 'bg-blue-400' : active ? 'bg-blue-500' : 'bg-gray-700'
              }`} />
              <span className={`text-xs transition-colors ${
                active ? 'text-blue-400 font-medium' : done ? 'text-gray-500' : 'text-gray-700'
              }`}>
                {label}
              </span>
            </div>
            {i < phases.length - 1 && (
              <div className={`w-6 h-px mb-4 transition-colors ${idx < phase ? 'bg-blue-500/40' : 'bg-gray-800'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
