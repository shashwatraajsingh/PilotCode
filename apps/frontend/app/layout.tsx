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
  title: 'PilotCode - Autonomous Software Engineer',
  description: 'Transform your development workflow with PilotCode, the AI software engineer that codes, tests, and deploys autonomously.',
  keywords: 'AI, software engineer, autonomous coding, development, automation',
  authors: [{ name: 'PilotCode Team' }],
  openGraph: {
    title: 'PilotCode - Your Autonomous Software Engineer',
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
      <body className="font-sans antialiased bg-background min-h-screen selection:bg-white/20">
        {/* Minimal background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-dot-pattern opacity-[0.3]"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background"></div>
        </div>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

