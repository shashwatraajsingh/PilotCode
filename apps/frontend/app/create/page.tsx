'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createTask } from '@/lib/api'
import { Send, Loader2, Github, Settings, ArrowLeft, Sparkles } from 'lucide-react'
import { GitHubConnect } from '@/components/GitHubConnect'
import { APIKeySettings } from '@/components/APIKeySettings'
import { useAuth } from '@/contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

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
    { label: 'Backend API', prompt: 'Create a NestJS backend with JWT authentication and Swagger documentation' },
    { label: 'React Component', prompt: 'Build a responsive data table component with sorting, filtering, and pagination' },
    { label: 'Bug Fix', prompt: 'Debug and fix the memory leak in the image processing worker' },
    { label: 'Refactoring', prompt: 'Refactor the legacy class components to functional components with hooks' },
  ]

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-brand-primary/30">
      <Header />

      {/* Background Glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-brand-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <section className="pt-32 pb-24 px-6">
        <div className="container mx-auto max-w-4xl">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="pl-0 hover:pl-2 transition-all"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to home
            </Button>
          </motion.div>

          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent" />

              <CardContent className="p-8 md:p-10">
                <div className="mb-8">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-3 mb-4"
                  >
                    <div className="p-2 rounded-lg bg-brand-primary/10 border border-brand-primary/20">
                      <Sparkles className="w-5 h-5 text-brand-primary" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">
                      Create New Task
                    </h1>
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-slate-400 text-lg"
                  >
                    Describe what you want to build, and let PilotCode handle the rest.
                  </motion.p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Main Input */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <label className="block text-sm font-medium text-slate-300 mb-3 ml-1">
                      Task Description
                    </label>
                    <div className="relative group">
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g., 'Add JWT authentication to my Express API with refresh tokens and email verification'"
                        className="w-full h-40 px-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-transparent resize-none transition-all text-lg leading-relaxed group-hover:bg-white/[0.07]"
                        disabled={loading}
                      />
                      <div className="absolute bottom-4 right-4 text-xs text-slate-500">
                        {description.length} chars
                      </div>
                    </div>
                  </motion.div>

                  {/* Smart Suggestions */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <p className="text-sm text-slate-400 mb-3 font-medium ml-1">Try these examples:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {smartSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setDescription(suggestion.prompt)}
                          className="text-left p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-brand-primary/30 transition-all group"
                        >
                          <span className="block text-xs font-bold text-brand-primary mb-1 group-hover:text-brand-secondary transition-colors">
                            {suggestion.label}
                          </span>
                          <span className="block text-sm text-slate-300 line-clamp-1">
                            {suggestion.prompt}
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Settings & Integrations */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5"
                  >
                    {/* API Keys Toggle */}
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowSettings(!showSettings)}
                        className="w-full justify-between h-auto py-4 px-5 border-dashed border-white/20 hover:border-brand-primary/50 hover:bg-brand-primary/5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-white/5">
                            <Settings className="w-5 h-5 text-slate-400" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium text-white">API Configuration</div>
                            <div className="text-xs text-slate-400">Configure LLM keys (BYOK)</div>
                          </div>
                        </div>
                        <span className="text-xs text-brand-primary font-medium">
                          {showSettings ? 'Hide' : 'Configure'}
                        </span>
                      </Button>

                      <AnimatePresence>
                        {showSettings && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            className="overflow-hidden"
                          >
                            <Card className="bg-black/20 border-white/5">
                              <CardContent className="p-4">
                                <APIKeySettings onSave={handleSaveApiKeys} />
                              </CardContent>
                            </Card>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* GitHub Toggle */}
                    <div>
                      {isConnected ? (
                        <div className="w-full p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Github className="w-5 h-5 text-emerald-400" />
                            <div>
                              <p className="text-sm font-semibold text-white">Repository Connected</p>
                              <p className="text-xs text-emerald-400/80 truncate max-w-[150px]">{repoUrl}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setIsConnected(false)
                              setRepoUrl('')
                              setGithubToken('')
                            }}
                            className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 h-8"
                          >
                            Disconnect
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowGitHub(!showGitHub)}
                            className="w-full justify-between h-auto py-4 px-5 border-dashed border-white/20 hover:border-brand-primary/50 hover:bg-brand-primary/5"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-white/5">
                                <Github className="w-5 h-5 text-slate-400" />
                              </div>
                              <div className="text-left">
                                <div className="font-medium text-white">GitHub Integration</div>
                                <div className="text-xs text-slate-400">Connect a repository (Optional)</div>
                              </div>
                            </div>
                            <span className="text-xs text-brand-primary font-medium">
                              {showGitHub ? 'Cancel' : 'Connect'}
                            </span>
                          </Button>

                          <AnimatePresence>
                            {showGitHub && (
                              <motion.div
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                className="overflow-hidden"
                              >
                                <Card className="bg-black/20 border-white/5">
                                  <CardContent className="p-4">
                                    <GitHubConnect onConnect={handleGitHubConnect} />
                                  </CardContent>
                                </Card>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      )}
                    </div>
                  </motion.div>

                  {/* Submit Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="pt-4"
                  >
                    <Button
                      type="submit"
                      disabled={!description.trim() || loading}
                      className="w-full h-16 text-lg font-bold shadow-xl shadow-brand-primary/20 hover:shadow-brand-primary/40 transition-all"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin mr-3" />
                          Initializing Agent...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-3" />
                          Start Building
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
