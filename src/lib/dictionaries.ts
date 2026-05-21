import 'server-only'

const dictionaries = {
  'zh-CN': () => import('@/../dictionaries/zh-CN.json').then(m => m.default),
  'zh-TW': () => import('@/../dictionaries/zh-TW.json').then(m => m.default),
  en: () => import('@/../dictionaries/en.json').then(m => m.default),
  es: () => import('@/../dictionaries/es.json').then(m => m.default),
  ar: () => import('@/../dictionaries/ar.json').then(m => m.default),
  fr: () => import('@/../dictionaries/fr.json').then(m => m.default),
  ja: () => import('@/../dictionaries/ja.json').then(m => m.default),
  pt: () => import('@/../dictionaries/pt.json').then(m => m.default),
}

export type Locale = keyof typeof dictionaries
export const locales = Object.keys(dictionaries) as Locale[]
export const defaultLocale: Locale = 'zh-CN'

export const hasLocale = (locale: string): locale is Locale => locale in dictionaries

export async function getDictionary(locale: Locale) {
  return dictionaries[locale]()
}

/** Brand name rule: zh-CN/zh-TW → 解负智能, all others → Jiefu AI */
export function getBrandName(locale: Locale): string {
  return locale === 'zh-CN' || locale === 'zh-TW' ? '解负智能' : 'Jiefu AI'
}
