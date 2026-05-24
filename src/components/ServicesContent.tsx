'use client'

import { useLiveContent } from '@/lib/useLiveContent'
import type { ServiceItem } from '@/lib/content'
import { Search, Bot, Workflow, Server } from 'lucide-react'
import Link from 'next/link'

const iconMap: Record<string, React.ElementType> = { Search, Bot, Workflow, Server }

interface Props {
  lang: string
  dict: { pages: { servicesSubtitle: string }; nav: { services: string }; common: { getStarted: string } }
  initial: ServiceItem[]
}

export default function ServicesContent({ lang, dict, initial }: Props) {
  const { content } = useLiveContent<{ services: ServiceItem[] }>('zh-CN', 'services', null)
  const services = content?.services || initial

  return (
    <div className="pt-24 pb-20 px-4">
      <div className="max-w-5xl mx-auto">
        <section className="text-center mb-20">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 gradient-text">{dict.nav.services}</h1>
          <p className="text-lg text-[var(--foreground)]/50 max-w-2xl mx-auto">{dict.pages.servicesSubtitle}</p>
        </section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((svc) => {
            const Icon = iconMap[svc.icon] ?? Server
            return (
              <div key={svc.id} className="p-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50 hover:bg-[var(--surface)] hover:border-[var(--primary)]/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center mb-4">
                  <Icon size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{svc.title}</h3>
                <p className="text-sm text-[var(--foreground)]/50 mb-4 leading-relaxed">{svc.description}</p>
                <ul className="space-y-2">
                  {svc.features.map((f, i) => (
                    <li key={i} className="text-sm text-[var(--foreground)]/60 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />{f}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
        <div className="text-center mt-12">
          <Link href={`/${lang}/contact`} className="inline-flex px-8 py-3 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white font-medium hover:opacity-90 transition-opacity">
            {dict.common.getStarted}
          </Link>
        </div>
      </div>
    </div>
  )
}
