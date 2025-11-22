import type { Metadata } from 'next'
import { DM_Sans, Exo_2, Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
})

const exo2 = Exo_2({
  subsets: ['latin'],
  variable: '--font-exo-2',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Devin AI - Autonomous Software Engineer',
  description: 'Transform your development workflow with Devin, the AI software engineer that codes, tests, and deploys autonomously.',
  keywords: 'AI, software engineer, autonomous coding, development, automation',
  authors: [{ name: 'Devin AI Team' }],
  openGraph: {
    title: 'Devin AI - Your Autonomous Software Engineer',
    description: 'Transform your development workflow with an AI that actually understands your codebase.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${exo2.variable} ${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="font-sans antialiased bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-screen">
        {/* Animated background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

