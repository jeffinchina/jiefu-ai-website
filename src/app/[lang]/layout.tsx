import { Geist, Geist_Mono } from 'next/font/google'
import { notFound } from 'next/navigation'
import { hasLocale, getDictionary, locales, getBrandName, type Locale } from '@/lib/dictionaries'

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }))
}

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ClientLayout from '@/components/ClientLayout'
import '../globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  if (!hasLocale(lang)) notFound()

  const dict = await getDictionary(lang as Locale)
  const brandName = getBrandName(lang as Locale)

  return (
    <html
      lang={lang}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <Navbar
          locale={lang as Locale}
          dict={dict}
          brandName={brandName}
        />
        <main className="flex-1 relative z-10">{children}</main>
        <Footer dict={dict} brandName={brandName} locale={lang} />
        <ClientLayout
          greeting={dict.aiPet.greeting}
          placeholder={dict.aiPet.placeholder}
        />
      </body>
    </html>
  )
}
