import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import GatePage from './pages/GatePage'
import HomePage from './pages/HomePage'
import LogPage from './pages/LogPage'
import LibraryPage from './pages/LibraryPage'
import WeeklyPage from './pages/WeeklyPage'

export default function App() {
  return (
    <BrowserRouter>
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
