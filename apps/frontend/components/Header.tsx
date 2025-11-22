'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, User, LogOut, Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { LogoMinimal } from '@/components/Logo'

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout, isAuthenticated } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: 'Features', href: '/#features' },
    { name: 'How it Works', href: '/#how-it-works' },
    { name: 'Pricing', href: '/pricing' },
  ]

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${isScrolled || mobileMenuOpen ? 'bg-background/80 backdrop-blur-md border-border' : 'bg-transparent border-transparent'
        }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div
          onClick={() => router.push('/')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-8 h-8 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
            <LogoMinimal className="w-8 h-8 text-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            PilotCode
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/50 border border-border">
                <User className="w-3.5 h-3.5 text-foreground" />
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
              <Button
                size="sm"
                onClick={() => router.push('/create')}
              >
                Create Task
              </Button>
            </div>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/login')}
              >
                Sign In
              </Button>
              <Button
                size="sm"
                onClick={() => router.push('/create')}
              >
                Get Started
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-b border-border overflow-hidden"
          >
            <div className="container mx-auto px-6 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}

              <div className="h-px bg-border my-2" />

              {isAuthenticated ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <User className="w-4 h-4" />
                    <span>{user?.email}</span>
                  </div>
                  <Button onClick={() => router.push('/create')} className="w-full">
                    Create Task
                  </Button>
                  <Button variant="outline" onClick={logout} className="w-full">
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Button variant="ghost" onClick={() => router.push('/login')} className="w-full">
                    Sign In
                  </Button>
                  <Button onClick={() => router.push('/create')} className="w-full">
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
