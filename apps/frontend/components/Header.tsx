'use client'

import { Brain, Plus, Menu, X, Sparkles, LogOut, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'


const navLinks = [
  { name: 'Features', href: '#features' },
  { name: 'Pricing', href: '#pricing' },
  { name: 'Docs', href: '#docs' },
  { name: 'About', href: '#about' },
]

export function Header() {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { scrollY } = useScroll()
  const { user, logout, isAuthenticated } = useAuth()

  const headerOpacity = useTransform(scrollY, [0, 120], [0.65, 0.9])


  return (
    <motion.header
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(16px)',
      }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 shadow-2xl"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="container mx-auto px-5 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            className="flex items-center space-x-2.5"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <div className="relative">
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-purple-500 via-emerald-400 to-amber-400 rounded-2xl blur-lg"
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="relative bg-gradient-to-br from-purple-500 via-emerald-400 to-amber-400 p-2.5 rounded-2xl shadow-xl"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Brain className="w-5 h-5 text-white" />
              </motion.div>
            </div>
            <div className="hidden sm:block">
              <motion.h1
                className="text-lg font-semibold bg-gradient-to-r from-white via-purple-200 to-emerald-200 bg-clip-text text-transparent"
                whileHover={{ scale: 1.02 }}
              >
                Devin AI
              </motion.h1>
              <motion.p
                className="text-[11px] text-slate-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Autonomous Software Engineer
              </motion.p>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((item, index) => (
              <motion.a
                key={item.name}
                href={item.href}
                className="relative text-[15px] text-slate-300 hover:text-white transition-colors font-medium group"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                whileHover={{ y: -2 }}
              >
                {item.name}
                <motion.div
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-emerald-400 rounded-full"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.2 }}
                />
              </motion.a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3.5">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  <User className="w-4 h-4 text-slate-300" />
                  <span className="text-sm text-slate-300">{user?.email}</span>
                </div>
                <motion.button
                  onClick={logout}
                  className="px-3.5 py-1.5 text-slate-300 hover:text-white transition-colors font-medium text-sm flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </motion.button>
              </>
            ) : (
              <motion.button
                onClick={() => router.push('/login')}
                className="px-3.5 py-1.5 text-slate-300 hover:text-white transition-colors font-medium text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign In
              </motion.button>
            )}
            <motion.button
              onClick={() => router.push('/create')}
              className="group relative px-5 py-2 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-slate-500/25 transition-all duration-300 overflow-hidden"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-slate-500 via-slate-400 to-slate-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={false}
              />
              <div className="relative z-10 flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                Create Task
                <Sparkles className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors backdrop-blur-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{ rotate: isMobileMenuOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.div>
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="md:hidden bg-slate-950/95 backdrop-blur-xl border-t border-white/10 shadow-2xl"
          >
            <div className="px-6 py-6 space-y-6">
              <nav className="flex flex-col space-y-4">
                {navLinks.map((item, index) => (
                  <motion.a
                    key={item.name}
                    href={item.href}
                    className="text-slate-300 hover:text-white transition-colors font-medium py-3 px-4 rounded-lg hover:bg-white/5"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ x: 5 }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </motion.a>
                ))}
              </nav>
              <motion.div
                className="pt-6 border-t border-white/10 space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {isAuthenticated ? (
                  <>
                    <div className="px-4 py-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-slate-300" />
                        <span className="text-sm text-slate-300">{user?.email}</span>
                      </div>
                    </div>
                    <motion.button
                      onClick={() => {
                        logout()
                        setIsMobileMenuOpen(false)
                      }}
                      className="w-full px-4 py-3 text-slate-300 hover:text-white transition-colors font-medium text-left rounded-lg hover:bg-white/5 flex items-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </motion.button>
                  </>
                ) : (
                  <motion.button
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      router.push('/login')
                    }}
                    className="w-full px-4 py-3 text-slate-300 hover:text-white transition-colors font-medium text-left rounded-lg hover:bg-white/5"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Sign In
                  </motion.button>
                )}
                <motion.button
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    router.push('/create')
                  }}
                  className="w-full px-6 py-3 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-slate-500/25 transition-all duration-300 flex items-center justify-center gap-3"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus className="w-5 h-5" />
                  Create Task
                  <Sparkles className="w-4 h-4" />
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
