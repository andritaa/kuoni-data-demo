import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Kuoni Data Intelligence Platform',
  description: 'Executive analytics powered by Snowflake — DERTOUR/Kuoni',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans min-h-screen`} style={{ background: '#F8F6F3', color: '#1A1A1A' }}>
        {children}
      </body>
    </html>
  )
}
