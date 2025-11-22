'use client'

import { useEffect, useState } from 'react'
import { getTasks } from '@/lib/api'
import { TaskCard } from './TaskCard'
import { Loader2, ListTodo } from 'lucide-react'

interface Task {
  id: string
  description: string
  status: string
  createdAt: string
  executionPlan?: {
    subtasks: Array<{
      id: string
      description: string
      status: string
    }>
  }
}

interface TaskListProps {
  refreshTrigger: number
}

export function TaskList({ refreshTrigger }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTasks()
  }, [refreshTrigger])

  const loadTasks = async () => {
    try {
      const data = await getTasks()
      setTasks(data)
    } catch (error) {
      console.error('Failed to load tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <ListTodo className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-700 mb-2">No tasks yet</h3>
        <p className="text-gray-600">Create your first task to get started!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
        <ListTodo className="w-6 h-6" />
        <span>Recent Tasks</span>
      </h2>

      <div className="grid gap-4">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  )
}
