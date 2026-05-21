import { notFound } from 'next/navigation'
import { hasLocale, getDictionary, type Locale } from '@/lib/dictionaries'
import HardwareTool from '@/components/HardwareTool'

export default async function HardwarePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const dict = await getDictionary(lang as Locale)
  return <HardwareTool dict={dict} />
}
