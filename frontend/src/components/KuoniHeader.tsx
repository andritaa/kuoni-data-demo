'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function KuoniHeader() {
  const pathname = usePathname()

  const navLinks = [
    { href: '/',           label: 'Executive' },
    { href: '/dashboard',  label: 'Analytics' },
  ]

  return (
    <header style={{ backgroundColor: '#1B4F6B' }} className="text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span
                className="text-2xl font-bold tracking-widest"
                style={{ color: '#C9A96E', letterSpacing: '0.25em', fontFamily: 'Georgia, serif' }}
              >
                KUONI
              </span>
              <span className="text-xs tracking-wider opacity-80 -mt-1">
                DATA INTELLIGENCE PLATFORM
              </span>
            </div>
            {/* Snowflake badge */}
            <span className="snowflake-badge hidden sm:inline-flex">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L9.5 7H4l4 4-1.5 5.5L12 14l5.5 2.5L16 11l4-4h-5.5L12 2z" />
              </svg>
              Powered by Snowflake
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                style={pathname === link.href ? { backgroundColor: '#C9A96E' } : {}}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3 text-xs text-white/60">
            <span className="hidden md:block">Live Data · {new Date().getFullYear()}</span>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="Connected" />
          </div>
        </div>
      </div>
    </header>
  )
}
