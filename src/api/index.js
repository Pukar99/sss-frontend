const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

async function request(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  return res.json()
}

// Stock
export const saveTrade = (data) => request('POST', '/api/stock/trade', data)
export const saveResearch = (data) => request('POST', '/api/stock/research', data)
export const getStockEntries = (date) => request('GET', `/api/stock/${date}`)

// Learning
export const createLearningEntry = (data) => request('POST', '/api/learning', data)
export const getLearningEntries = (filters) => {
  const params = new URLSearchParams(filters).toString()
  return request('GET', `/api/learning${params ? `?${params}` : ''}`)
}
export const getLearningEntry = (id) => request('GET', `/api/learning/${id}`)
export const updateLearningEntry = (id, data) => request('PATCH', `/api/learning/${id}`, data)
export const deleteLearningEntry = (id) => request('DELETE', `/api/learning/${id}`)

// Progress
export const saveProgressLog = (data) => request('POST', '/api/progress', data)
export const getProgressLogs = (entryId) => request('GET', `/api/progress/${entryId}`)

// Revision
export const saveRevision = (data) => request('POST', '/api/revision', data)
export const getRevisionsDue = () => request('GET', '/api/revision/due')

// Alignment
export const saveAlignmentScore = (data) => request('POST', '/api/alignment', data)
export const getAlignmentScore = (date) => request('GET', `/api/alignment/${date}`)

// Weekly
export const getWeeklyData = (startDate) => request('GET', `/api/weekly/${startDate}`)

// AI
export const aiPlan = (answer, topic) => request('POST', '/api/ai/plan', { answer, topic })
export const aiAssess = (data) => request('POST', '/api/ai/assess', data)
export const aiInsight = (data) => request('POST', '/api/ai/insight', data)
export const aiAlignment = (data) => request('POST', '/api/ai/alignment', data)
export const aiWeekly = (weekData) => request('POST', '/api/ai/weekly', { weekData })
export const aiRevision = (data) => request('POST', '/api/ai/revision', data)

// Media
export const uploadPhoto = (file) => {
  const form = new FormData()
  form.append('photo', file)
  return fetch(`${BASE_URL}/api/media/photo`, { method: 'POST', body: form }).then((r) => r.json())
}
export const uploadVideo = (file) => {
  const form = new FormData()
  form.append('video', file)
  return fetch(`${BASE_URL}/api/media/video`, { method: 'POST', body: form }).then((r) => r.json())
}
