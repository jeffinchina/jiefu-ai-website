import { notFound } from 'next/navigation'
import { hasLocale, getDictionary, type Locale } from '@/lib/dictionaries'
import { getContent, getCompanyStats } from '@/lib/content'
import ParticleBackground from '@/components/ParticleBackground'
import StatsCounter from '@/components/StatsCounter'
import Link from 'next/link'

interface HomeContent {
  hero: { title: string; subtitle: string; cta: string }
  intro: { heading: string; description: string }
  whyUs: {
    heading: string
    items: { title: string; description: string }[]
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const locale = lang as Locale
  const dict = await getDictionary(locale)
  const homeContent = getContent<HomeContent>(locale, 'home')
  const stats = getCompanyStats(locale)

  const hero = {
    title: homeContent?.hero?.title ?? dict.hero.title,
    subtitle: homeContent?.hero?.subtitle ?? dict.hero.subtitle,
  }

  return (
    <>
      <ParticleBackground />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-16">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)]/50 text-sm text-[var(--foreground)]/60 mb-8">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            AI-Powered Enterprise Solutions
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6">
            {/[一-鿿]/.test(hero.title)
              ? hero.title.split('').map((char, i) => (
                  <span key={i} className="inline-block gradient-text" style={{ animationDelay: `${i * 0.05}s` }}>
                    {char === ' ' ? ' ' : char}
                  </span>
                ))
              : (
                <span className="gradient-text">{hero.title}</span>
              )}
          </h1>

          <p className="text-lg sm:text-xl text-[var(--foreground)]/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            {hero.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${lang}/contact`}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white font-medium hover:opacity-90 transition-opacity"
            >
              {dict.hero.cta}
            </Link>
            <Link
              href={`/${lang}/cases`}
              className="px-8 py-3 rounded-xl border border-[var(--border)] text-[var(--foreground)]/70 hover:text-[var(--foreground)] hover:border-[var(--foreground)]/20 transition-colors"
            >
              {dict.common.viewAll}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <StatsCounter stats={stats} locale={locale} />
        </div>
      </section>

      {/* What We Do */}
      <section className="py-20 px-4 bg-[var(--surface)]/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            {homeContent?.intro.heading ?? '我们做什么'}
          </h2>
          <p className="text-center text-[var(--foreground)]/50 max-w-2xl mx-auto mb-12">
            {homeContent?.intro.description}
          </p>

          {/* Why Us Grid */}
          <h3 className="text-2xl font-bold text-center mb-8">
            {homeContent?.whyUs.heading ?? '为什么选择我们'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(homeContent?.whyUs.items ?? []).map((item, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50 hover:bg-[var(--surface)] hover:border-[var(--primary)]/30 transition-all"
              >
                <h4 className="font-semibold mb-2">{item.title}</h4>
                <p className="text-sm text-[var(--foreground)]/50">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
