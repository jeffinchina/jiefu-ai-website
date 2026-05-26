import { notFound } from 'next/navigation'
import { hasLocale, getDictionary, type Locale } from '@/lib/dictionaries'
import { getCaseStudies } from '@/lib/content'
import CasesContent from '@/components/CasesContent'

export default async function CasesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const locale = lang as Locale
  const dict = await getDictionary(locale)
  const initial = getCaseStudies(locale)
  return <CasesContent locale={lang} dict={{
    pages: { casesSubtitle: dict.pages.casesSubtitle },
    nav: { cases: dict.nav.cases },
  }} initial={initial} />
}
