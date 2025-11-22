'use client'

import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'

export default function Home() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 font-sans text-white">
      <Header />

      <section className="pt-40 pb-24">
        <div className="container mx-auto px-6 max-w-5xl text-center space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-sm text-slate-300"
          >
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
            Devin · Autonomous Software Engineer
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight"
          >
            Ship world-class software with an AI engineer on your team
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto"
          >
            Devin plans, codes, tests, and ships production-ready features. All you need to do is approve the pull request.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/create')}
            className="mx-auto flex items-center gap-3 px-7 py-4 rounded-xl bg-gradient-to-r from-purple-500 via-emerald-400 to-amber-400 text-slate-900 font-semibold shadow-xl"
          >
            <Plus className="w-5 h-5" />
            Create a task
          </motion.button>
        </div>
      </section>

      <section className="pb-32">
        <div className="container mx-auto px-6 max-w-6xl grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 * item }}
              className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl"
            >
              <h3 className="text-2xl font-semibold mb-3">Production-ready agentic workflows</h3>
              <p className="text-slate-300 leading-relaxed">
                We replaced nested sections with a simplified landing page so you can finish the redesign without JSX parser errors.
              </p>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  )
}
