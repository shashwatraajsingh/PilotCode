'use client'

import { useState } from 'react'
import { Github, Link as LinkIcon, CheckCircle2 } from 'lucide-react'

interface GitHubConnectProps {
  onConnect: (repoUrl: string, githubToken?: string) => void
}

export function GitHubConnect({ onConnect }: GitHubConnectProps) {
  const [repoUrl, setRepoUrl] = useState('')
  const [githubToken, setGithubToken] = useState('')
  const [showToken, setShowToken] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConnect(repoUrl, githubToken || undefined)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gray-900 rounded-lg">
          <Github className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Connect GitHub Repository</h3>
          <p className="text-sm text-gray-600">Link your repo so Devin can create pull requests</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Repository URL *
          </label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/repository"
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            The GitHub repository where Devin will create pull requests
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium mb-2"
          >
            {showToken ? '− Hide' : '+ Add'} GitHub Personal Access Token (optional)
          </button>
          
          {showToken && (
            <div>
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Required for private repositories. Create one at{' '}
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  github.com/settings/tokens
                </a>
              </p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!repoUrl.trim()}
          className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>Connect Repository</span>
        </button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-gray-700">
          <strong className="text-blue-600">ℹ️ Note:</strong> Devin will clone your repository, create a new branch, make changes, and open a pull request for your review.
        </p>
      </div>
    </div>
  )
}
