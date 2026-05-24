import { notFound } from 'next/navigation'
import { hasLocale, getDictionary, type Locale } from '@/lib/dictionaries'
import { getServices } from '@/lib/content'
import ServicesContent from '@/components/ServicesContent'

export default async function ServicesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const locale = lang as Locale
  const dict = await getDictionary(locale)
  const initial = getServices(locale)
  return <ServicesContent lang={lang} dict={{
    pages: { servicesSubtitle: dict.pages.servicesSubtitle },
    nav: { services: dict.nav.services },
    common: { getStarted: dict.common.getStarted },
  }} initial={initial} />
}
