// Cloudflare Pages Function: GET /api/admin/content?file=content/zh-CN/team.json
export async function onRequest(context: { request: Request; env: Record<string, string> }) {
  const url = new URL(context.request.url)
  const file = url.searchParams.get('file') || ''

  const ALLOWED = [
    'content/zh-CN/common.json', 'content/zh-CN/home.json', 'content/zh-CN/team.json',
    'content/zh-CN/services.json', 'content/zh-CN/cases.json',
    'content/en/common.json', 'content/en/home.json', 'content/en/team.json',
    'content/en/services.json', 'content/en/cases.json',
    'content/zh-TW/common.json',
    'dictionaries/zh-CN.json', 'dictionaries/en.json',
  ]
  if (!ALLOWED.includes(file)) {
    return Response.json({ error: '文件不允许' }, { status: 403 })
  }

  const token = context.env.GITHUB_TOKEN || context.env.GH_TOKEN || ''
  if (!token) {
    // Try serving from the deployed site's static assets
    return Response.json({ error: 'GitHub Token 未配置' }, { status: 500 })
  }

  try {
    const resp = await fetch(
      `https://api.github.com/repos/jeffinchina/jiefu-ai-website/contents/${file}`,
      { headers: { Authorization: `token ${token}`, 'User-Agent': 'jiefu-ai-admin', Accept: 'application/vnd.github.v3.raw' } }
    )
    if (!resp.ok) {
      return Response.json({ error: `GitHub API: ${resp.status}` }, { status: resp.status })
    }
    const content = await resp.json()
    return Response.json(content)
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}
