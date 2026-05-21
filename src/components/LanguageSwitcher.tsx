'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, Check } from 'lucide-react'

const languageOptions = [
  { code: 'zh-CN', label: '简体中文', native: '简体中文' },
  { code: 'zh-TW', label: '繁體中文', native: '繁體中文' },
  { code: 'en', label: 'English', native: 'English' },
  { code: 'es', label: 'Español', native: 'Español' },
  { code: 'ar', label: 'العربية', native: 'العربية' },
  { code: 'fr', label: 'Français', native: 'Français' },
  { code: 'ja', label: '日本語', native: '日本語' },
  { code: 'pt', label: 'Português', native: 'Português' },
]

export default function LanguageSwitcher({ locale }: { locale: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentLang = languageOptions.find((l) => l.code === locale) ?? languageOptions[0]

  function switchTo(code: string) {
    const path = window.location.pathname.replace(`/${locale}`, `/${code}`)
    router.push(path)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-lg hover:bg-white/5 transition-colors text-[var(--foreground)]/70"
      >
        <Globe size={16} />
        <span className="hidden sm:inline">{currentLang.native}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl py-1 overflow-hidden">
          {languageOptions.map((lang) => (
            <button
              key={lang.code}
              onClick={() => switchTo(lang.code)}
              className="w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-white/5 transition-colors text-left"
            >
              <span>
                <span className="text-[var(--foreground)]">{lang.native}</span>
                <span className="text-[var(--foreground)]/40 ml-2">
                  {lang.label}
                </span>
              </span>
              {lang.code === locale && (
                <Check size={14} className="text-[var(--accent)]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
