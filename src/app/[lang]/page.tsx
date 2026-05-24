import { notFound } from 'next/navigation'
import { hasLocale, getDictionary, type Locale } from '@/lib/dictionaries'
import { getContent, getCompanyStats } from '@/lib/content'
import ParticleBackground from '@/components/ParticleBackground'
import HomeContent from '@/components/HomeContent'

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const locale = lang as Locale
  const dict = await getDictionary(locale)
  const initialHome = getContent<{
    hero: { title: string; subtitle: string; cta: string }
    intro: { heading: string; description: string }
    whyUs: { heading: string; items: { title: string; description: string }[] }
  }>(locale, 'home')
  const initialStats = getCompanyStats(locale)

  return (
    <>
      <ParticleBackground />
      <HomeContent lang={lang} locale={locale} dict={{
        hero: { title: dict.hero.title, subtitle: dict.hero.subtitle, cta: dict.hero.cta },
        common: { viewAll: dict.common.viewAll },
      }} stats={initialStats} initial={initialHome} />
    </>
  )
}
