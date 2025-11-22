'use client'

import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { CheckCircle2, XCircle, Loader2, AlertCircle, Code, Terminal, FileEdit } from 'lucide-react'

interface TaskProgress {
  taskId: string
  message: string
  progress?: number
  step?: string
  timestamp: string
}

interface TaskStatus {
  taskId: string
  status: string
  metadata?: any
  timestamp: string
}

interface CommandResult {
  taskId: string
  command: string
  exitCode: number
  stdout: string
  stderr: string
  duration: number
  timestamp: string
}

interface CodeReview {
  taskId: string
  file: string
  issues: Array<{
    line: number
    severity: 'error' | 'warning' | 'info'
    message: string
  }>
  suggestions: string[]
  timestamp: string
}

export function TaskMonitor({ taskId }: { taskId: string }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [progress, setProgress] = useState<TaskProgress[]>([])
  const [status, setStatus] = useState<string>('connecting')
  const [commands, setCommands] = useState<CommandResult[]>([])
  const [reviews, setReviews] = useState<CodeReview[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Connect to WebSocket
    const socketInstance = io(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/events`, {
      transports: ['websocket', 'polling'],
    })

    socketInstance.on('connect', () => {
      console.log('WebSocket connected')
      setIsConnected(true)
      
      // Subscribe to task updates
      socketInstance.emit('subscribe:task', { taskId })
    })

    socketInstance.on('disconnect', () => {
      console.log('WebSocket disconnected')
      setIsConnected(false)
    })

    // Listen for task progress
    socketInstance.on('task:progress', (data: TaskProgress) => {
      setProgress((prev) => [...prev, data])
    })

    // Listen for status changes
    socketInstance.on('task:status', (data: TaskStatus) => {
      setStatus(data.status)
    })

    // Listen for command results
    socketInstance.on('task:command', (data: CommandResult) => {
      setCommands((prev) => [...prev, data])
    })

    // Listen for code reviews
    socketInstance.on('task:review', (data: CodeReview) => {
      setReviews((prev) => [...prev, data])
    })

    setSocket(socketInstance)

    return () => {
      if (socketInstance) {
        socketInstance.emit('unsubscribe:task', { taskId })
        socketInstance.disconnect()
      }
    }
  }, [taskId])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'running':
      case 'initialized':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
      default:
        return <AlertCircle className="w-5 h-5 text-grey-medium" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'running':
      case 'initialized':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      default:
        return 'bg-grey-light text-grey-dark border-grey-medium'
    }
  }

  return (
    <div className="h-full flex flex-col bg-light-primary">
      {/* Header */}
      <div className="border-b border-grey-light p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-dark-primary">Task Monitor</h2>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1 border ${getStatusColor(status)}`}>
              {getStatusIcon(status)}
              <span className="text-sm font-medium capitalize">{status}</span>
            </div>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Progress Log */}
        <div className="bg-light-secondary border border-grey-light p-4">
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="w-4 h-4 text-dark-primary" />
            <h3 className="font-semibold text-dark-primary">Progress</h3>
          </div>
          <div className="space-y-2 font-mono text-sm">
            {progress.length === 0 ? (
              <p className="text-grey-medium">Waiting for updates...</p>
            ) : (
              progress.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-grey-dark"
                >
                  <span className="text-grey-medium">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                  <span>{item.message}</span>
                  {item.progress !== undefined && (
                    <span className="text-blue-600 ml-auto">
                      {item.progress}%
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Command Results */}
        {commands.length > 0 && (
          <div className="bg-light-secondary border border-grey-light p-4">
            <div className="flex items-center gap-2 mb-3">
              <Code className="w-4 h-4 text-dark-primary" />
              <h3 className="font-semibold text-dark-primary">Commands</h3>
            </div>
            <div className="space-y-3">
              {commands.map((cmd, index) => (
                <div
                  key={index}
                  className={`p-3 border ${
                    cmd.exitCode === 0
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <code className="text-sm font-mono text-dark-primary">
                      $ {cmd.command}
                    </code>
                    <span className="text-xs text-grey-medium">
                      {cmd.duration}ms
                    </span>
                  </div>
                  {cmd.stdout && (
                    <pre className="text-xs text-grey-dark whitespace-pre-wrap mt-2">
                      {cmd.stdout}
                    </pre>
                  )}
                  {cmd.stderr && (
                    <pre className="text-xs text-red-600 whitespace-pre-wrap mt-2">
                      {cmd.stderr}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Code Review */}
        {reviews.length > 0 && (
          <div className="bg-light-secondary border border-grey-light p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileEdit className="w-4 h-4 text-dark-primary" />
              <h3 className="font-semibold text-dark-primary">Code Review</h3>
            </div>
            <div className="space-y-3">
              {reviews.map((review, index) => (
                <div key={index} className="space-y-2">
                  <p className="text-sm font-medium text-dark-primary">
                    {review.file}
                  </p>
                  {review.issues.length > 0 && (
                    <div className="space-y-1">
                      {review.issues.slice(0, 5).map((issue, issueIndex) => (
                        <div
                          key={issueIndex}
                          className={`text-xs p-2 border ${
                            issue.severity === 'error'
                              ? 'bg-red-50 border-red-200'
                              : issue.severity === 'warning'
                              ? 'bg-yellow-50 border-yellow-200'
                              : 'bg-blue-50 border-blue-200'
                          }`}
                        >
                          <span className="font-mono">Line {issue.line}:</span>{' '}
                          {issue.message}
                        </div>
                      ))}
                    </div>
                  )}
                  {review.suggestions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-grey-dark mb-1">
                        Suggestions:
                      </p>
                      <ul className="text-xs text-grey-dark space-y-1">
                        {review.suggestions.map((suggestion, sugIndex) => (
                          <li key={sugIndex}>• {suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
