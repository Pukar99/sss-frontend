import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import GatePage from './pages/GatePage'
import HomePage from './pages/HomePage'
import LogPage from './pages/LogPage'
import LibraryPage from './pages/LibraryPage'
import WeeklyPage from './pages/WeeklyPage'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2500,
          style: {
            background: '#1a1a1a',
            color: '#e5e5e5',
            border: '1px solid #2a2a2a',
            borderRadius: '14px',
            fontSize: '13px',
            fontFamily: 'Inter, system-ui, sans-serif',
            padding: '10px 16px',
          },
          success: {
            iconTheme: { primary: '#22c55e', secondary: '#0a0a0a' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#0a0a0a' },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<GatePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/log" element={<LogPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/weekly" element={<WeeklyPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
