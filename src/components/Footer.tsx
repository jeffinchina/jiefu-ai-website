import Link from 'next/link'
import LiveBrand from './LiveBrand'

interface FooterProps {
  dict: { footer: { copyright: string; tagline: string }; nav: Record<string, string> }
  brandName: string
  locale: string
}

export default function Footer({ dict, brandName, locale }: FooterProps) {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold gradient-text mb-2">{brandName}</h3>
            <p className="text-sm text-[var(--foreground)]/50">{dict.footer.tagline}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3 text-[var(--foreground)]/70">快速链接</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(dict.nav).map(([key, label]) => (
                <Link key={key} href={key === 'home' ? '/' : `/${key}`} className="text-sm text-[var(--foreground)]/40 hover:text-[var(--foreground)] transition-colors">{label}</Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3 text-[var(--foreground)]/70">联系我们</h4>
            <p className="text-sm text-[var(--foreground)]/40">
              <LiveBrand locale={locale} field="email" fallback="contact@lmrun.com" />
            </p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-[var(--border)] text-center text-sm text-[var(--foreground)]/30">
          {dict.footer.copyright}
        </div>
      </div>
    </footer>
  )
}
