import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function GatePage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (localStorage.getItem('sss_verified') === 'true') {
      navigate('/home', { replace: true })
    }
  }, [navigate])

  function handleSubmit(e) {
    e.preventDefault()
    if (name.trim().toLowerCase() === 'pukar sharma') {
      localStorage.setItem('sss_verified', 'true')
      navigate('/home', { replace: true })
    } else {
      setError('Access denied.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-xs">

        {/* Logo area */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <div className="w-2 h-2 rounded-full bg-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">SSS</h1>
          <p className="text-xs text-gray-500 mt-1 tracking-widest uppercase">Study · Skill · Stock</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError('') }}
            placeholder="Your name"
            autoFocus
            className="w-full bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-600 text-center"
          />
          {error && <p className="text-xs text-red-400 text-center">{error}</p>}
          <button
            type="submit"
            className="w-full bg-white hover:bg-gray-100 text-gray-900 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  )
}
