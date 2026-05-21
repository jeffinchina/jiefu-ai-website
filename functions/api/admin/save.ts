// Cloudflare Pages Function: POST /api/admin/save
import { jwtVerify } from 'jose'

const ALLOWED_FILES = [
  'content/zh-CN/common.json', 'content/zh-CN/home.json', 'content/zh-CN/team.json',
  'content/zh-CN/services.json', 'content/zh-CN/cases.json',
  'content/en/common.json', 'content/en/home.json', 'content/en/team.json',
  'content/en/services.json', 'content/en/cases.json',
  'content/zh-TW/common.json', 'content/zh-TW/home.json', 'content/zh-TW/team.json',
  'content/zh-TW/services.json', 'content/zh-TW/cases.json',
  'dictionaries/zh-CN.json', 'dictionaries/zh-TW.json', 'dictionaries/en.json',
  'dictionaries/es.json', 'dictionaries/ar.json', 'dictionaries/fr.json',
  'dictionaries/ja.json', 'dictionaries/pt.json',
]

function validateContent(filePath: string, content: unknown): string | null {
  const fileName = filePath.split('/').pop() || ''

  // dictionaries: basic object check
  if (fileName.endsWith('.json') && filePath.startsWith('dictionaries/')) {
    if (typeof content !== 'object' || content === null || Array.isArray(content)) {
      return '内容必须是 JSON 对象'
    }
    return null
  }

  // content files: basic structure check
  if (typeof content !== 'object' || content === null || Array.isArray(content)) {
    return '内容必须是 JSON 对象'
  }

  const obj = content as Record<string, unknown>

  // common.json
  if (fileName === 'common.json') {
    if (!obj.brand || typeof obj.brand !== 'object') return '缺少 brand 字段'
    if (!obj.stats || typeof obj.stats !== 'object') return '缺少 stats 字段'
    if (!Array.isArray(obj.branches)) return 'branches 必须是数组'
    const brand = obj.brand as Record<string, unknown>
    if (!brand.name || typeof brand.name !== 'string' || !brand.name.trim()) return 'brand.name 不能为空'
    if (!brand.email || typeof brand.email !== 'string' || !brand.email.includes('@')) return 'brand.email 格式不正确'
    return null
  }

  // home.json
  if (fileName === 'home.json') {
    if (!obj.hero || typeof obj.hero !== 'object') return '缺少 hero 字段'
    if (!obj.intro || typeof obj.intro !== 'object') return '缺少 intro 字段'
    if (!obj.whyUs || typeof obj.whyUs !== 'object') return '缺少 whyUs 字段'
    const hero = obj.hero as Record<string, unknown>
    if (!hero.title || typeof hero.title !== 'string' || !hero.title.trim()) return 'hero.title 不能为空'
    return null
  }

  // team.json
  if (fileName === 'team.json') {
    if (!Array.isArray(obj.members)) return 'members 必须是数组'
    for (const m of obj.members as Record<string, unknown>[]) {
      if (!m.name || !m.title || !m.bio) return '每个成员必须有 name/title/bio'
    }
    return null
  }

  // services.json
  if (fileName === 'services.json') {
    if (!Array.isArray(obj.services)) return 'services 必须是数组'
    for (const s of obj.services as Record<string, unknown>[]) {
      if (!s.id || !s.title || !s.description) return '每个服务必须有 id/title/description'
    }
    return null
  }

  // cases.json
  if (fileName === 'cases.json') {
    if (!Array.isArray(obj.cases)) return 'cases 必须是数组'
    for (const c of obj.cases as Record<string, unknown>[]) {
      if (!c.id || !c.title || !c.challenge || !c.solution || !c.result) {
        return '每个案例必须有 id/title/challenge/solution/result'
      }
    }
    return null
  }

  return null
}

async function verifyJWT(token: string, secret: string): Promise<boolean> {
  try {
    await jwtVerify(token, new TextEncoder().encode(secret))
    return true
  } catch { return false }
}

export async function onRequestPost(context: { request: Request; env: Record<string, string> }) {
  const { env } = context
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  try {
    // Auth
    const authHeader = context.request.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    const jwtSecret = env.JWT_SECRET || 'default-secret-change-me'
    if (!(await verifyJWT(token, jwtSecret))) {
      return Response.json({ error: '未授权' }, { status: 401, headers: corsHeaders })
    }

    const { file, content, message } = await context.request.json() as {
      file: string; content: unknown; message?: string
    }

    // Validate file path
    if (!ALLOWED_FILES.includes(file)) {
      return Response.json({ error: '不允许的文件路径' }, { status: 403, headers: corsHeaders })
    }

    // Validate content
    const validationError = validateContent(file, content)
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400, headers: corsHeaders })
    }

    const token_gh = env.GITHUB_TOKEN || env.GH_TOKEN || ''
    if (!token_gh) {
      return Response.json({ error: 'GitHub Token 未配置' }, { status: 500, headers: corsHeaders })
    }

    const repo = 'jeffinchina/jiefu-ai-website'
    const apiBase = `https://api.github.com/repos/${repo}/contents/${file}`

    // Get current SHA (with retry)
    let sha = ''
    for (let attempt = 0; attempt < 3; attempt++) {
      const getResp = await fetch(apiBase, {
        headers: { Authorization: `token ${token_gh}`, 'User-Agent': 'jiefu-ai-admin' },
      })
      if (getResp.ok) {
        const data = await getResp.json() as { sha: string }
        sha = data.sha
        break
      }
      if (getResp.status === 404) break // File doesn't exist yet
      if (attempt < 2) await new Promise(r => setTimeout(r, 500))
    }

    // Write file via GitHub API
    const commitMessage = message || `admin: update ${file}`
    const body: Record<string, unknown> = {
      message: commitMessage,
      content: btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2) + '\n'))),
      branch: 'main',
    }
    if (sha) body.sha = sha

    const putResp = await fetch(apiBase, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token_gh}`,
        'User-Agent': 'jiefu-ai-admin',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!putResp.ok) {
      const err = await putResp.json() as { message: string }
      return Response.json({ error: `GitHub API 错误: ${err.message}` }, { status: 500, headers: corsHeaders })
    }

    const result = await putResp.json() as { content: { sha: string; html_url: string } }
    return Response.json({
      success: true,
      sha: result.content.sha,
      message: '保存成功，网站将在 2-3 分钟后更新',
    }, { headers: corsHeaders })

  } catch (e) {
    return Response.json({ error: `服务器错误: ${(e as Error).message}` }, { status: 500, headers: corsHeaders })
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
