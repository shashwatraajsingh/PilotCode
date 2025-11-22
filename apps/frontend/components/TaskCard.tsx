'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle2, Circle, XCircle, Loader2, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface TaskCardProps {
  task: {
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
}

export function TaskCard({ task }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false)

  const statusConfig = {
    PLANNED: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', spin: false },
    RUNNING: { icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', spin: true },
    SUCCESS: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', spin: false },
    FAILED: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', spin: false },
    RETRY: { icon: Loader2, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', spin: true },
  }

  const config = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.PLANNED
  const Icon = config.icon

  const completedSubtasks = task.executionPlan?.subtasks.filter(st => st.status === 'SUCCESS').length || 0
  const totalSubtasks = task.executionPlan?.subtasks.length || 0
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors shadow-sm">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <div className={`${config.bg} p-2 rounded-lg border ${config.border}`}>
                <Icon className={`w-5 h-5 ${config.color} ${config.spin ? 'animate-spin' : ''}`} />
              </div>
              <span className={`text-sm font-medium ${config.color}`}>
                {task.status}
              </span>
              <span className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
              </span>
            </div>

            <h3 className="text-lg font-medium text-gray-900 mb-2">{task.description}</h3>

            {totalSubtasks > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Progress: {completedSubtasks} / {totalSubtasks} subtasks
                  </span>
                  <span className="text-gray-600">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <Link
            href={`/tasks/${task.id}`}
            className="ml-4 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors text-sm font-medium"
          >
            View Details
          </Link>
        </div>

        {task.executionPlan && task.executionPlan.subtasks.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span>{expanded ? 'Hide' : 'Show'} subtasks</span>
            </button>

            {expanded && (
              <div className="mt-3 space-y-2">
                {task.executionPlan.subtasks.map((subtask, index) => {
                  const subtaskConfig = statusConfig[subtask.status as keyof typeof statusConfig] || statusConfig.PLANNED
                  const SubtaskIcon = subtaskConfig.icon

                  return (
                    <div
                      key={subtask.id}
                      className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className={`${subtaskConfig.bg} p-1.5 rounded border ${subtaskConfig.border}`}>
                        <SubtaskIcon className={`w-4 h-4 ${subtaskConfig.color} ${subtaskConfig.spin ? 'animate-spin' : ''}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">{subtask.description}</p>
                        <span className={`text-xs ${subtaskConfig.color}`}>{subtask.status}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
