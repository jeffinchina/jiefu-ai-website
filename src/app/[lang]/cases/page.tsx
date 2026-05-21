import { notFound } from 'next/navigation'
import { hasLocale, getDictionary, type Locale } from '@/lib/dictionaries'
import { getCaseStudies } from '@/lib/content'

export default async function CasesPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const locale = lang as Locale
  const dict = await getDictionary(locale)
  const cases = getCaseStudies(locale)

  return (
    <div className="pt-24 pb-20 px-4">
      <div className="max-w-5xl mx-auto">
        <section className="text-center mb-20">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 gradient-text">
            {dict.nav.cases}
          </h1>
          <p className="text-lg text-[var(--foreground)]/50 max-w-2xl mx-auto">
            {dict.pages.casesSubtitle}
          </p>
        </section>

        <div className="space-y-8">
          {cases.map((c) => (
            <article
              key={c.id}
              className="p-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50 hover:bg-[var(--surface)] transition-all"
            >
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)] mb-4">
                {c.industry}
              </span>
              <h2 className="text-xl font-bold mb-6">{c.title}</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--accent)] mb-2">
                    挑战
                  </h3>
                  <p className="text-sm text-[var(--foreground)]/60 leading-relaxed">
                    {c.challenge}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--accent)] mb-2">
                    方案
                  </h3>
                  <p className="text-sm text-[var(--foreground)]/60 leading-relaxed">
                    {c.solution}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--accent)] mb-2">
                    效果
                  </h3>
                  <p className="text-sm text-[var(--foreground)]/60 leading-relaxed">
                    {c.result}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
