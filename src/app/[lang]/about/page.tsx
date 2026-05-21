import { notFound } from 'next/navigation'
import { hasLocale, getDictionary, type Locale } from '@/lib/dictionaries'
import { getTeam, getBranches, getCompanyStats, getContent } from '@/lib/content'

export default async function AboutPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const locale = lang as Locale
  const dict = await getDictionary(locale)
  const team = getTeam(locale)
  const branches = getBranches(locale)
  const common = getContent<{
    brand: { name: string; slogan: string }
  }>(locale, 'common')

  return (
    <div className="pt-24 pb-20 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Hero */}
        <section className="text-center mb-20">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 gradient-text">
            {dict.nav.about}
          </h1>
          <p className="text-lg text-[var(--foreground)]/50 max-w-2xl mx-auto">
            {dict.pages.aboutSubtitle}
          </p>
        </section>

        {/* Branches Map */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold mb-8 text-center">{dict.pages.aboutBranches || '全球分支机构'}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {branches.map((b) => (
              <div
                key={b.city}
                className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 text-left hover:border-[var(--primary)]/30 transition-colors"
              >
                <div className="font-bold text-base">{b.city}<span className="text-xs text-[var(--foreground)]/40 ml-1.5 font-normal">{b.country}</span></div>
                <div className="text-xs text-[var(--foreground)]/50 mt-1.5 leading-relaxed">{b.address}</div>
                {b.phone && (
                  <div className="text-xs text-[var(--accent)] mt-1">{b.phone}</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section>
          <h2 className="text-2xl font-bold mb-8 text-center">{dict.pages.aboutTeam || '核心团队'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member) => (
              <div
                key={member.name}
                className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50 hover:bg-[var(--surface)] transition-all"
              >
                {/* Photo area */}
                <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden border-2 border-[var(--border)] bg-[var(--surface)]">
                  {member.photo ? (
                    <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/20 text-[var(--foreground)]/30">
                      <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-[10px]">Photo</span>
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-center mb-1">{member.name}</h3>
                <p className="text-xs text-[var(--accent)] text-center mb-3">
                  {member.title}
                </p>
                <p className="text-xs text-[var(--foreground)]/50 leading-relaxed">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
