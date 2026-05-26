'use client'

import { useLiveContent } from '@/lib/useLiveContent'

interface BrandData { brand: { email?: string; wechat?: string; slogan?: string; sloganEn?: string; phone?: string; qrcode?: string } }

export default function LiveBrand({ locale, field, fallback, className }: { locale: string; field: 'email' | 'wechat' | 'slogan' | 'sloganEn' | 'phone'; fallback: string; className?: string }) {
  const { content } = useLiveContent<BrandData>(locale, 'common', null)
  const value = content?.brand?.[field] || fallback
  return <span className={className}>{value}</span>
}

export function LiveBrandQR({ locale }: { locale: string }) {
  const { content } = useLiveContent<BrandData>(locale, 'common', null)
  const qrcode = content?.brand?.qrcode
  if (!qrcode) return null
  return <img src={qrcode} alt="WeChat QR" className="h-full max-h-28 w-auto object-contain rounded-lg border border-[var(--border)]" />
}
