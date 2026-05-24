import { notFound } from 'next/navigation'
import { hasLocale, getDictionary, type Locale } from '@/lib/dictionaries'
import { getTeam, getBranches } from '@/lib/content'
import AboutContent from '@/components/AboutContent'

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const locale = lang as Locale
  const dict = await getDictionary(locale)
  const initialTeam = getTeam(locale)
  const initialBranches = getBranches(locale)

  return <AboutContent locale={locale} dict={{
    pages: { aboutSubtitle: dict.pages.aboutSubtitle, aboutBranches: dict.pages.aboutBranches, aboutTeam: dict.pages.aboutTeam },
    nav: { about: dict.nav.about },
  }} initialTeam={initialTeam} initialBranches={initialBranches} />
}
