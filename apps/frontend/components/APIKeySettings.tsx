'use client'

import { useState } from 'react'
import { Key, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'

interface APIKeySettingsProps {
  onSave: (keys: {
    openaiApiKey?: string
    anthropicApiKey?: string
    githubToken?: string
  }) => void
}

export function APIKeySettings({ onSave }: APIKeySettingsProps) {
  const [openaiKey, setOpenaiKey] = useState('')
  const [anthropicKey, setAnthropicKey] = useState('')
  const [githubToken, setGithubToken] = useState('')
  const [showOpenAI, setShowOpenAI] = useState(false)
  const [showAnthropic, setShowAnthropic] = useState(false)
  const [showGitHub, setShowGitHub] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    // Store in localStorage for persistence
    if (openaiKey) localStorage.setItem('openai_api_key', openaiKey)
    if (anthropicKey) localStorage.setItem('anthropic_api_key', anthropicKey)
    if (githubToken) localStorage.setItem('github_token', githubToken)

    onSave({
      openaiApiKey: openaiKey || undefined,
      anthropicApiKey: anthropicKey || undefined,
      githubToken: githubToken || undefined,
    })

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const hasAnyKey = openaiKey || anthropicKey || githubToken

  return (
    <div className="bg-dark-secondary rounded-xl p-6 border border-cyan-accent/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-cyan-accent/10 rounded-lg">
          <Key className="w-5 h-5 text-cyan-accent" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-light-bg">API Keys (BYOK)</h3>
          <p className="text-sm text-gray-400">Bring your own keys - stored locally in your browser</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* OpenAI API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            OpenAI API Key (Optional)
          </label>
          <div className="relative">
            <input
              type={showOpenAI ? 'text' : 'password'}
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-4 py-3 pr-12 bg-dark-bg border border-cyan-accent/20 rounded-lg text-light-bg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-accent focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowOpenAI(!showOpenAI)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-accent"
            >
              {showOpenAI ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Get your key from{' '}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-accent hover:underline"
            >
              platform.openai.com
            </a>
          </p>
        </div>

        {/* Anthropic API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Anthropic API Key (Optional)
          </label>
          <div className="relative">
            <input
              type={showAnthropic ? 'text' : 'password'}
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full px-4 py-3 pr-12 bg-dark-bg border border-cyan-accent/20 rounded-lg text-light-bg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-accent focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowAnthropic(!showAnthropic)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-accent"
            >
              {showAnthropic ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Get your key from{' '}
            <a
              href="https://console.anthropic.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-accent hover:underline"
            >
              console.anthropic.com
            </a>
          </p>
        </div>

        {/* GitHub Token */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            GitHub Personal Access Token (Optional)
          </label>
          <div className="relative">
            <input
              type={showGitHub ? 'text' : 'password'}
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              placeholder="ghp_..."
              className="w-full px-4 py-3 pr-12 bg-dark-bg border border-cyan-accent/20 rounded-lg text-light-bg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-accent focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowGitHub(!showGitHub)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-accent"
            >
              {showGitHub ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Get your token from{' '}
            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-accent hover:underline"
            >
              github.com/settings/tokens
            </a>
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-cyan-accent/10 border border-cyan-accent/20 rounded-lg">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-cyan-accent flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-gray-300">
              <strong className="text-cyan-accent">Privacy First:</strong> Your API keys are stored locally in your browser and sent directly to the AI providers. They are never stored on our servers.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={!hasAnyKey}
        className="w-full mt-6 bg-cyan-accent hover:bg-opacity-90 disabled:bg-dark-bg disabled:cursor-not-allowed text-dark-bg disabled:text-gray-600 font-bold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
      >
        {saved ? (
          <>
            <CheckCircle2 className="w-5 h-5" />
            <span>Saved!</span>
          </>
        ) : (
          <>
            <Key className="w-5 h-5" />
            <span>Save API Keys</span>
          </>
        )}
      </button>
    </div>
  )
}
