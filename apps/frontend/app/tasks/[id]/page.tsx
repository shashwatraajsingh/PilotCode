'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getTask, deliverTask } from '@/lib/api'
import { ArrowLeft, GitPullRequest, Loader2, Terminal, FileCode, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useWebSocket } from '@/lib/useWebSocket'

export default function TaskDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const taskId = params.id as string
  
  const [task, setTask] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [delivering, setDelivering] = useState(false)

  const { messages } = useWebSocket(taskId)

  useEffect(() => {
    loadTask()
  }, [taskId])

  const loadTask = async () => {
    try {
      const data = await getTask(taskId)
      setTask(data)
    } catch (error) {
      console.error('Failed to load task:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeliver = async () => {
    setDelivering(true)
    try {
      await deliverTask(taskId)
      await loadTask()
    } catch (error) {
      console.error('Failed to deliver task:', error)
      alert('Failed to create PR')
    } finally {
      setDelivering(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-white mb-4">Task not found</h1>
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            Go back home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to tasks</span>
        </Link>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{task.task.description}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>Status: <span className="text-blue-400">{task.task.status}</span></span>
                <span>•</span>
                <span>Progress: {task.workflowStatus.progress}%</span>
              </div>
            </div>

            {task.task.status === 'SUCCESS' && task.task.repoUrl && (
              <button
                onClick={handleDeliver}
                disabled={delivering}
                className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {delivering ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <GitPullRequest className="w-5 h-5" />
                )}
                <span>Create PR</span>
              </button>
            )}
          </div>

          <div className="w-full bg-gray-700 rounded-full h-3 mb-6">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${task.workflowStatus.progress}%` }}
            />
          </div>

          {/* Subtasks */}
          {task.task.executionPlan && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-white flex items-center space-x-2 mb-4">
                <FileCode className="w-5 h-5" />
                <span>Execution Plan ({task.task.executionPlan.subtasks.length} subtasks)</span>
              </h2>

              {task.task.executionPlan.subtasks.map((subtask: any, index: number) => (
                <div
                  key={subtask.id}
                  className="p-4 bg-gray-900/50 rounded-lg border border-gray-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl font-bold text-gray-600">{index + 1}</span>
                      <div>
                        <h3 className="text-white font-medium mb-2">{subtask.description}</h3>
                        
                        {subtask.filesToEdit && subtask.filesToEdit.length > 0 && (
                          <div className="mb-2">
                            <span className="text-xs text-gray-400">Files: </span>
                            <span className="text-xs text-blue-400">
                              {subtask.filesToEdit.join(', ')}
                            </span>
                          </div>
                        )}

                        {subtask.commandsToRun && subtask.commandsToRun.length > 0 && (
                          <div className="space-y-1">
                            {subtask.commandsToRun.map((cmd: string, i: number) => (
                              <div key={i} className="flex items-center space-x-2 text-xs">
                                <Terminal className="w-3 h-3 text-gray-500" />
                                <code className="text-gray-400">{cmd}</code>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      {subtask.status === 'SUCCESS' && (
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      )}
                      {subtask.status === 'FAILED' && (
                        <XCircle className="w-6 h-6 text-red-400" />
                      )}
                      {subtask.status === 'RUNNING' && (
                        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Real-time logs */}
        {messages.length > 0 && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
              <Terminal className="w-5 h-5" />
              <span>Live Progress</span>
            </h2>

            <div className="space-y-2 max-h-96 overflow-y-auto font-mono text-sm">
              {messages.map((msg, index) => (
                <div key={index} className="text-gray-300">
                  <span className="text-gray-500">[{new Date(msg.timestamp).toLocaleTimeString()}]</span>{' '}
                  {msg.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PR Info */}
        {task.task.deliveries && task.task.deliveries.length > 0 && task.task.deliveries[0].prUrl && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 mt-6">
            <h2 className="text-xl font-semibold text-green-400 mb-4">✓ Pull Request Created</h2>
            <a
              href={task.task.deliveries[0].prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              View PR #{task.task.deliveries[0].prNumber}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
