'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Globe, Menu, X } from 'lucide-react'
import type { Locale } from '@/lib/dictionaries'
import LanguageSwitcher from './LanguageSwitcher'

interface NavbarProps {
  locale: Locale
  dict: {
    nav: Record<string, string>
  }
  brandName: string
}

const navKeys = ['home', 'about', 'services', 'cases', 'hardware', 'contact']

export default function Navbar({ locale, dict, brandName }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="fixed top-0 w-full z-50 bg-[var(--surface)]/80 backdrop-blur-xl border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2 text-lg font-bold tracking-tight"
          >
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white text-sm">
              J
            </span>
            <span className="gradient-text text-sm sm:text-lg">{brandName}</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navKeys.map((key) => (
              <Link
                key={key}
                href={`/${locale}${key === 'home' ? '' : `/${key}`}`}
                className="px-3 py-2 text-sm text-[var(--foreground)]/70 hover:text-[var(--foreground)] rounded-lg hover:bg-white/5 transition-colors"
              >
                {dict.nav[key]}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher locale={locale} />
            <button
              className="md:hidden p-2 rounded-lg hover:bg-white/5"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-[var(--border)] pt-2">
            {navKeys.map((key) => (
              <Link
                key={key}
                href={`/${locale}${key === 'home' ? '' : `/${key}`}`}
                className="block px-3 py-2.5 text-sm text-[var(--foreground)]/70 hover:text-[var(--foreground)] rounded-lg hover:bg-white/5 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {dict.nav[key]}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
