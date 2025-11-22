const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function createTask(data: {
  description: string
  repoUrl?: string
  repoPath?: string
  targetBranch?: string
  autoDeliver?: boolean
  openaiApiKey?: string
  anthropicApiKey?: string
  githubToken?: string
}) {
  const token = localStorage.getItem('access_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Failed to create task')
  }

  return response.json()
}

export async function getTasks(limit: number = 20) {
  const token = localStorage.getItem('access_token')
  const headers: Record<string, string> = {}

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}/tasks?limit=${limit}`, { headers })

  if (!response.ok) {
    throw new Error('Failed to fetch tasks')
  }

  return response.json()
}

export async function getTask(taskId: string) {
  const token = localStorage.getItem('access_token')
  const headers: Record<string, string> = {}

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}/tasks/${taskId}`, { headers })

  if (!response.ok) {
    throw new Error('Failed to fetch task')
  }

  return response.json()
}

export async function deliverTask(taskId: string) {
  const token = localStorage.getItem('access_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}/tasks/${taskId}/deliver`, {
    method: 'POST',
    headers,
  })

  if (!response.ok) {
    throw new Error('Failed to deliver task')
  }

  return response.json()
}
