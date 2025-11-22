'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowRight, Code2, Cpu, GitBranch, Terminal, Zap, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/Header'


export default function LandingPage() {
  const router = useRouter()

  const features = [
    {
      icon: <BrainIcon className="w-5 h-5 text-foreground" />,
      title: "Autonomous Planning",
      description: "PilotCode breaks down complex tasks into actionable steps, planning its approach just like a senior engineer."
    },
    {
      icon: <Code2 className="w-5 h-5 text-foreground" />,
      title: "Full-Stack Coding",
      description: "Writes clean, production-ready code across the entire stack, from database schemas to frontend components."
    },
    {
      icon: <Terminal className="w-5 h-5 text-foreground" />,
      title: "Self-Healing Debugging",
      description: "Encounters an error? PilotCode analyzes the stack trace, fixes the bug, and verifies the solution automatically."
    },
    {
      icon: <GitBranch className="w-5 h-5 text-foreground" />,
      title: "GitHub Integration",
      description: "Seamlessly integrates with your workflow. Creates branches, commits changes, and opens Pull Requests."
    },
    {
      icon: <Cpu className="w-5 h-5 text-foreground" />,
      title: "Sandboxed Execution",
      description: "All code runs in secure, isolated Docker containers, ensuring safety and consistency."
    },
    {
      icon: <Shield className="w-5 h-5 text-foreground" />,
      title: "Enterprise Security",
      description: "Built with security first. Your API keys and code are protected with industry-standard encryption."
    }
  ]

  return (
    <div className="min-h-screen bg-background font-sans text-foreground overflow-hidden selection:bg-foreground/10">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            <span className="inline-block py-1 px-3 rounded-full bg-secondary/30 border border-border text-xs font-medium text-muted-foreground mb-8">
              The Future of Software Engineering
            </span>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
              Meet PilotCode.<br />
              <span className="text-muted-foreground">The AI Software Engineer.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-light">
              PilotCode doesn't just autocomplete code. It plans, builds, tests, and deploys entire applications autonomously.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => router.push('/create')}
                className="w-full sm:w-auto h-12 px-8 text-base"
              >
                Start Building <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-12 px-8 text-base bg-background"
                onClick={() => window.open('https://github.com', '_blank')}
              >
                Documentation
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 border-t border-border/50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:bg-secondary/20 transition-colors border-border/50 shadow-none">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-md bg-secondary/30 flex items-center justify-center mb-4 border border-border">
                      {feature.icon}
                    </div>
                    <CardTitle className="mb-2 text-lg">{feature.title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 border-t border-border/50">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-4xl font-bold mb-6 tracking-tight">Ready to ship faster?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 font-light">
              Join thousands of developers who are building the future with PilotCode.
            </p>
            <Button
              size="lg"
              onClick={() => router.push('/create')}
              className="h-12 px-10 text-base"
            >
              Get Started Now
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50 text-center text-muted-foreground text-sm">
        <p>© 2025 PilotCode. All rights reserved.</p>
      </footer>
    </div>
  )
}

function BrainIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
  )
}
