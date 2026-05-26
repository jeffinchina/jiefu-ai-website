'use client'

import { useState } from 'react'
import { Mail, Send, MessageCircle } from 'lucide-react'
import LiveBrand from './LiveBrand'

interface Props { dict: Record<string, unknown>; locale: string }
type Dict = { pages: Record<string, string>; nav: Record<string, string> }

export default function ContactForm({ dict, locale }: Props) {
  const d = dict as unknown as Dict
  const [form, setForm] = useState({ name: '', company: '', email: '', message: '' })
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    console.log('Contact form:', form)
    setSent(true)
  }

  return (
    <div className="pt-24 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <section className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 gradient-text">{d.nav.contact}</h1>
          <p className="text-lg text-[var(--foreground)]/50 max-w-2xl mx-auto">{d.pages.contactSubtitle}</p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50">
              <div className="flex items-center gap-3 mb-4"><Mail size={20} className="text-[var(--accent)]" /><h3 className="font-semibold">{d.pages.contactEmailLabel}</h3></div>
              <p className="text-sm text-[var(--foreground)]/50"><LiveBrand locale={locale} field="email" fallback="contact@lmrun.com" /></p>
            </div>
            <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50">
              <div className="flex items-center gap-3 mb-2"><MessageCircle size={20} className="text-[var(--accent)]" /><h3 className="font-semibold">{d.pages.contactWechatLabel}</h3></div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <LiveBrand locale={locale} field="wechat" fallback={d.pages.contactWechatHint} className="text-sm text-[var(--foreground)]/50" />
                </div>
                <LiveBrandQR locale={locale} />
              </div>
            </div>
            <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50">
              <h3 className="font-semibold mb-2">{d.pages.contactRegionsLabel}</h3>
              <p className="text-sm text-[var(--foreground)]/50">{d.pages.contactRegionsText}<br />{d.pages.contactRemoteText}</p>
            </div>
          </div>

          <div className="p-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50">
            {sent ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-4"><Send size={24} className="text-[var(--accent)]" /></div>
                <h3 className="font-semibold mb-2">{d.pages.contactSent}</h3>
                <p className="text-sm text-[var(--foreground)]/50">{d.pages.contactSentHint}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="block text-sm font-medium mb-1.5">{d.pages.contactName}</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors" /></div>
                <div><label className="block text-sm font-medium mb-1.5">{d.pages.contactCompany}</label><input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors" /></div>
                <div><label className="block text-sm font-medium mb-1.5">{d.pages.contactEmail}</label><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors" /></div>
                <div><label className="block text-sm font-medium mb-1.5">{d.pages.contactMessage}</label><textarea required rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors resize-none" /></div>
                <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"><Send size={16} /><span>{d.pages.contactSend}</span></button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
