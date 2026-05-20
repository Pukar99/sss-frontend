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
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-base font-semibold text-white mb-1">SSS</h1>
        <p className="text-xs text-gray-500 mb-8">Study · Skill · Stock</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError('') }}
            placeholder="Enter your name"
            autoFocus
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
          />
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  )
}
