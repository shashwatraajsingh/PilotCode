'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'
import { LogIn, Loader2, Mail, Lock, User, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

export default function LoginPage() {
    const router = useRouter()
    const { login, register: registerUser } = useAuth()
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            if (isLogin) {
                await login(email, password)
            } else {
                await registerUser(email, password, name)
            }
            router.push('/create')
        } catch (err: any) {
            setError(err.message || 'Authentication failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen bg-background font-sans text-foreground flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-primary/20 rounded-full blur-[100px] -z-10 opacity-50 pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-brand-secondary/10 rounded-full blur-[100px] -z-10 opacity-30 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md relative z-10"
            >
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
                    <CardContent className="p-8">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary p-0.5 mb-6 shadow-lg shadow-brand-primary/20"
                            >
                                <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center">
                                    <Sparkles className="w-8 h-8 text-white" />
                                </div>
                            </motion.div>
                            <h1 className="text-3xl font-bold mb-2 text-white">
                                {isLogin ? 'Welcome Back' : 'Create Account'}
                            </h1>
                            <p className="text-slate-400">
                                {isLogin ? 'Sign in to continue to PilotCode' : 'Join PilotCode today'}
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium"
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {!isLogin && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">
                                        Name
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                                        <Input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Your name"
                                            className="pl-12"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        required
                                        className="pl-12"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="pl-12"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 text-base font-semibold shadow-lg shadow-brand-primary/20"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        {isLogin ? 'Signing in...' : 'Creating account...'}
                                    </>
                                ) : (
                                    isLogin ? 'Sign In' : 'Create Account'
                                )}
                            </Button>
                        </form>

                        {/* Toggle */}
                        <div className="mt-8 text-center">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsLogin(!isLogin)
                                    setError('')
                                }}
                                className="text-sm text-slate-400 hover:text-white transition-colors"
                            >
                                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                                <span className="text-brand-primary font-semibold hover:underline">
                                    {isLogin ? 'Sign up' : 'Sign in'}
                                </span>
                            </button>
                        </div>

                        {/* Back to Home */}
                        <div className="mt-4 text-center">
                            <Link
                                href="/"
                                className="text-sm text-slate-500 hover:text-white transition-colors inline-flex items-center gap-1"
                            >
                                ← Back to home
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </main>
    )
}
