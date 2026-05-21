import { z } from 'zod'

export const BranchSchema = z.object({
  city: z.string().min(1).max(30),
  address: z.string().min(1).max(200),
  country: z.string().min(1).max(30),
  phone: z.string().max(30).optional(),
})

export const StatsSchema = z.object({
  clientsServed: z.number().int().min(0),
  solutionsDelivered: z.number().int().min(0),
  personDaysSaved: z.number().int().min(0),
})

export const BrandSchema = z.object({
  name: z.string().min(1).max(50),
  nameEn: z.string().min(1).max(50),
  slogan: z.string().min(1).max(100),
  sloganEn: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  wechat: z.string().max(50).optional(),
})

export const CommonSchema = z.object({
  brand: BrandSchema,
  stats: StatsSchema,
  branches: z.array(BranchSchema).min(1).max(20),
})

export const WhyUsItemSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
})

export const HomeSchema = z.object({
  hero: z.object({
    title: z.string().min(1).max(200),
    subtitle: z.string().min(1).max(500),
    cta: z.string().min(1).max(50),
  }),
  intro: z.object({
    heading: z.string().min(1).max(100),
    description: z.string().min(1).max(500),
  }),
  whyUs: z.object({
    heading: z.string().min(1).max(100),
    items: z.array(WhyUsItemSchema).min(1).max(10),
  }),
})

export const TeamMemberSchema = z.object({
  name: z.string().min(1).max(50),
  title: z.string().min(1).max(100),
  bio: z.string().min(1).max(1000),
  photo: z.string().max(500),
  real: z.boolean(),
})

export const TeamSchema = z.object({
  members: z.array(TeamMemberSchema).min(0).max(20),
})

export const ServiceItemSchema = z.object({
  id: z.string().min(1).max(30),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  icon: z.string().min(1).max(30),
  features: z.array(z.string().min(1).max(100)).min(1).max(10),
})

export const ServicesSchema = z.object({
  services: z.array(ServiceItemSchema).min(1).max(10),
})

export const CaseStudySchema = z.object({
  id: z.string().min(1).max(30),
  industry: z.string().min(1).max(30),
  title: z.string().min(1).max(200),
  challenge: z.string().min(1).max(2000),
  solution: z.string().min(1).max(2000),
  result: z.string().min(1).max(2000),
  image: z.string().max(500).optional(),
})

export const CasesSchema = z.object({
  cases: z.array(CaseStudySchema).min(0).max(50),
})

// Map file paths to their schemas
export const FILE_SCHEMAS: Record<string, z.ZodTypeAny> = {
  'common.json': CommonSchema,
  'home.json': HomeSchema,
  'team.json': TeamSchema,
  'services.json': ServicesSchema,
  'cases.json': CasesSchema,
}

// Allowed file paths (whitelist for security)
export const ALLOWED_FILES = [
  'content/zh-CN/common.json',
  'content/zh-CN/home.json',
  'content/zh-CN/team.json',
  'content/zh-CN/services.json',
  'content/zh-CN/cases.json',
  'content/en/common.json',
  'content/en/home.json',
  'content/en/team.json',
  'content/en/services.json',
  'content/en/cases.json',
  'content/zh-TW/common.json',
  'content/zh-TW/home.json',
  'content/zh-TW/team.json',
  'content/zh-TW/services.json',
  'content/zh-TW/cases.json',
  'dictionaries/zh-CN.json',
  'dictionaries/zh-TW.json',
  'dictionaries/en.json',
  'dictionaries/es.json',
  'dictionaries/ar.json',
  'dictionaries/fr.json',
  'dictionaries/ja.json',
  'dictionaries/pt.json',
]

export function validateContent(filePath: string, content: unknown) {
  const fileName = filePath.split('/').pop() || ''
  const schema = FILE_SCHEMAS[fileName]
  if (!schema) return { valid: true, errors: null } // dictionaries pass through
  const result = schema.safeParse(content)
  if (result.success) return { valid: true, errors: null }
  return { valid: false, errors: result.error.flatten().fieldErrors }
}
