import 'server-only'
import { readFileSync, readdirSync, existsSync } from 'fs'
import path from 'path'
import type { Locale } from './dictionaries'

const contentRoot = path.join(process.cwd(), 'content')

export interface TeamMember {
  name: string
  title: string
  bio: string
  photo: string
  real: boolean
}

export interface Branch {
  city: string
  address: string
  country: string
  phone?: string
  coordinates?: { lat: number; lng: number }
}

export interface CompanyStats {
  clientsServed: number
  solutionsDelivered: number
  personDaysSaved: number
}

export interface CaseStudy {
  id: string
  industry: string
  title: string
  challenge: string
  solution: string
  result: string
  image?: string
}

export interface ServiceItem {
  id: string
  title: string
  description: string
  icon: string
  features: string[]
}

export type ContentType = 'common' | 'home' | 'team' | 'cases' | 'services' | 'hardware'

function loadContent<T>(locale: Locale, type: ContentType): T | null {
  const tryLoad = (loc: string): T | null => {
    try {
      const filePath = path.join(contentRoot, loc, `${type}.json`)
      if (!existsSync(filePath)) return null
      return JSON.parse(readFileSync(filePath, 'utf-8'))
    } catch { return null }
  }
  if (locale === 'zh-CN') return tryLoad('zh-CN')
  if (locale === 'zh-TW') return tryLoad('zh-TW') ?? tryLoad('zh-CN')
  // Non-Chinese: try locale → try en → zh-CN
  return tryLoad(locale) ?? tryLoad('en') ?? tryLoad('zh-CN')
}

export function getContent<T>(locale: Locale, type: ContentType): T | null {
  return loadContent<T>(locale, type)
}

export function getTeam(locale: Locale): TeamMember[] {
  const data = loadContent<{ members: TeamMember[] }>(locale, 'team')
  return data?.members ?? []
}

export function getBranches(locale: Locale): Branch[] {
  const data = loadContent<{ branches: Branch[] }>(locale, 'common')
  return data?.branches ?? []
}

export function getCompanyStats(locale: Locale): CompanyStats {
  const data = loadContent<{ stats: CompanyStats }>(locale, 'common')
  return data?.stats ?? { clientsServed: 0, solutionsDelivered: 0, personDaysSaved: 0 }
}

export function getCaseStudies(locale: Locale): CaseStudy[] {
  const data = loadContent<{ cases: CaseStudy[] }>(locale, 'cases')
  return data?.cases ?? []
}

export function getServices(locale: Locale): ServiceItem[] {
  const data = loadContent<{ services: ServiceItem[] }>(locale, 'services')
  return data?.services ?? []
}
