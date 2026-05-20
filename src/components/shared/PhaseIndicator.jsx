// phase: 1 | 2 | 3  (Plan | Progress | Done)
export default function PhaseIndicator({ phase }) {
  const phases = ['Plan', 'Progress', 'Done']
  return (
    <div className="flex items-center gap-2">
      {phases.map((label, i) => {
        const idx = i + 1
        const active = idx === phase
        const done = idx < phase
        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${done || active ? 'bg-blue-500' : 'bg-gray-600'}`} />
              <span className={`text-xs ${active ? 'text-blue-400' : done ? 'text-gray-400' : 'text-gray-600'}`}>
                {label}
              </span>
            </div>
            {i < phases.length - 1 && (
              <div className={`w-8 h-px mb-4 ${idx < phase ? 'bg-blue-500' : 'bg-gray-600'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
