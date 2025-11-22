'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createTask } from '@/lib/api'
import { Send, Loader2, Github, Settings, ArrowLeft } from 'lucide-react'
import { GitHubConnect } from '@/components/GitHubConnect'
import { APIKeySettings } from '@/components/APIKeySettings'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'
import { Header } from '@/components/Header'

export default function CreateTaskPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [description, setDescription] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [githubToken, setGithubToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [showGitHub, setShowGitHub] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [apiKeys, setApiKeys] = useState<{
    openaiApiKey?: string
    anthropicApiKey?: string
    githubToken?: string
  }>({})

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  // Load API keys from localStorage on mount
  useEffect(() => {
    const openaiKey = localStorage.getItem('openai_api_key')
    const anthropicKey = localStorage.getItem('anthropic_api_key')
    const storedGithubToken = localStorage.getItem('github_token')

    setApiKeys({
      openaiApiKey: openaiKey || undefined,
      anthropicApiKey: anthropicKey || undefined,
      githubToken: storedGithubToken || undefined,
    })

    if (storedGithubToken) {
      setGithubToken(storedGithubToken)
    }
  }, [])

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
        openaiApiKey: apiKeys.openaiApiKey,
        anthropicApiKey: apiKeys.anthropicApiKey,
        githubToken: githubToken || apiKeys.githubToken,
      })

      router.push('/')
    } catch (error) {
      console.error('Failed to create task:', error)
      alert('Failed to create task. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveApiKeys = (keys: {
    openaiApiKey?: string
    anthropicApiKey?: string
    githubToken?: string
  }) => {
    setApiKeys(keys)
    if (keys.githubToken) {
      setGithubToken(keys.githubToken)
    }
  }

  const smartSuggestions = [
    { label: 'Backend', prompt: 'Add authentication to my backend API' },
    { label: 'Bugfix', prompt: 'Fix the memory leak in the image processor' },
    { label: 'Performance', prompt: 'Optimize database queries for better performance' },
  ]

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to login
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 font-sans text-white">
      <Header />

      <section className="pt-32 pb-24 px-6">
        <div className="container mx-auto max-w-4xl">
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </motion.button>

          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl"
          >
            <div className="mb-8">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl font-bold mb-3 bg-gradient-to-r from-white via-purple-200 to-emerald-200 bg-clip-text text-transparent"
              >
                Create New Task
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-slate-400"
              >
                Tell Devin what you need, and watch it build, test, and ship production-ready code
              </motion.p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Main Input */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Task Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., 'Add JWT authentication to my Express API with refresh tokens and email verification'"
                  className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent resize-none transition-all"
                  disabled={loading}
                />
              </motion.div>

              {/* Smart Suggestions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-sm text-slate-400 mb-3 font-medium">Quick suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {smartSuggestions.map((suggestion, index) => (
                    <motion.button
                      key={suggestion.label}
                      type="button"
                      onClick={() => setDescription(suggestion.prompt)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/10 hover:border-purple-500/50 transition-all"
                    >
                      {suggestion.label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* API Keys Settings */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="border-t border-white/10 pt-6"
              >
                <button
                  type="button"
                  onClick={() => setShowSettings(!showSettings)}
                  className="w-full p-4 border-2 border-dashed border-white/10 hover:border-purple-500/50 hover:bg-white/5 rounded-xl transition-all flex items-center justify-center gap-2 text-slate-400 hover:text-white font-medium"
                >
                  <Settings className="w-5 h-5" />
                  <span>{showSettings ? 'Hide' : 'Configure'} API Keys (BYOK)</span>
                </button>

                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4"
                  >
                    <APIKeySettings onSave={handleSaveApiKeys} />
                  </motion.div>
                )}
              </motion.div>

              {/* GitHub Connection */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="border-t border-white/10 pt-6"
              >
                {isConnected ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Github className="w-5 h-5 text-emerald-400" />
                      <div>
                        <p className="text-sm font-semibold text-white">Connected to Repository</p>
                        <p className="text-xs text-slate-400">{repoUrl}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsConnected(false)
                        setRepoUrl('')
                        setGithubToken('')
                      }}
                      className="text-sm text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowGitHub(!showGitHub)}
                    className="w-full p-4 border-2 border-dashed border-white/10 hover:border-purple-500/50 hover:bg-white/5 rounded-xl transition-all flex items-center justify-center gap-2 text-slate-400 hover:text-white font-medium"
                  >
                    <Github className="w-5 h-5" />
                    <span>{showGitHub ? 'Cancel' : 'Connect GitHub Repository (Optional)'}</span>
                  </button>
                )}

                {showGitHub && !isConnected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4"
                  >
                    <GitHubConnect onConnect={handleGitHubConnect} />
                  </motion.div>
                )}
              </motion.div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={!description.trim() || loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="w-full bg-gradient-to-r from-purple-500 via-emerald-400 to-amber-400 disabled:from-slate-700 disabled:via-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-slate-900 disabled:text-slate-400 font-bold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl"
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
              </motion.button>

              {/* Tip */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl"
              >
                <p className="text-sm text-slate-300">
                  <span className="font-bold text-purple-400">💡 Tip:</span> Be specific! The more details you provide about your requirements, technologies, and constraints, the better Devin can help you.
                </p>
              </motion.div>
            </form>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
