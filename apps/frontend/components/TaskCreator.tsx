'use client'

import { useState } from 'react'
import { createTask } from '@/lib/api'
import { Sparkles, Send, Loader2, Github } from 'lucide-react'
import { GitHubConnect } from './GitHubConnect'

interface TaskCreatorProps {
  onTaskCreated: () => void
}

export function TaskCreator({ onTaskCreated }: TaskCreatorProps) {
  const [description, setDescription] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [githubToken, setGithubToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [showGitHub, setShowGitHub] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  const handleGitHubConnect = (url: string, token?: string) => {
    setRepoUrl(url)
    if (token) setGithubToken(token)
    setIsConnected(true)
    setShowGitHub(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) return

    setLoading(true)
    try {
      await createTask({
        description,
        repoUrl: repoUrl || undefined,
        autoDeliver: true,
      })

      setDescription('')
      setRepoUrl('')
      onTaskCreated()
    } catch (error) {
      console.error('Failed to create task:', error)
      alert('Failed to create task. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
      <div className="flex items-center space-x-2 mb-6">
        <Sparkles className="w-5 h-5 text-blue-500" />
        <h2 className="text-2xl font-semibold text-gray-900">Create New Task</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell Devin what to build... e.g., 'Add JWT authentication to my Express API' or 'Fix the memory leak in the image processor'"
            className="w-full h-32 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={loading}
          />
        </div>

        {/* GitHub Connection */}
        {isConnected ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Github className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">Connected to Repository</p>
                <p className="text-xs text-green-700">{repoUrl}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsConnected(false)
                setRepoUrl('')
                setGithubToken('')
              }}
              className="text-sm text-green-700 hover:text-green-900 font-medium"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowGitHub(!showGitHub)}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <Github className="w-5 h-5" />
            <span className="font-medium">{showGitHub ? 'Cancel' : 'Connect GitHub Repository (Optional)'}</span>
          </button>
        )}

        {showGitHub && !isConnected && (
          <div className="mt-4">
            <GitHubConnect onConnect={handleGitHubConnect} />
          </div>
        )}

        <button
          type="submit"
          disabled={!description.trim() || loading}
          className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Creating Task...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Start Building</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-gray-700">
          <strong className="text-blue-600">Tip:</strong> Be specific! The more details you provide, the better Devin can help you.
        </p>
      </div>
    </div>
  )
}
