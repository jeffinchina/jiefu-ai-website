// Public content API - reads from GitHub with cache
export async function onRequest(context: { request: Request; env: Record<string, string> }) {
  const url = new URL(context.request.url)
  const file = url.searchParams.get('file') || ''

  const ALLOWED = [
    'content/zh-CN/common.json', 'content/zh-CN/home.json', 'content/zh-CN/team.json',
    'content/zh-CN/services.json', 'content/zh-CN/cases.json',
    'content/en/common.json', 'content/en/home.json', 'content/en/team.json',
    'content/en/services.json', 'content/en/cases.json',
    'content/zh-TW/common.json',
  ]
  if (!ALLOWED.includes(file)) {
    return Response.json({ error: 'Invalid file' }, { status: 403 })
  }

  const token = context.env.GITHUB_TOKEN || context.env.GH_TOKEN || ''

  try {
    let data: unknown = null

    if (token) {
      const resp = await fetch(
        `https://api.github.com/repos/jeffinchina/jiefu-ai-website/contents/${file}`,
        {
          headers: { Authorization: `token ${token}`, 'User-Agent': 'jiefu-ai', Accept: 'application/vnd.github.v3.raw' },
          cf: { cacheTtl: 30 }, // 30s cache
        } as RequestInit
      )
      if (resp.ok) data = await resp.json()
    }

    if (!data) {
      // Fallback: serve from deployed static assets
      const fallback = await fetch(`https://jiefu-ai.pages.dev/${file}`)
      if (fallback.ok) data = await fallback.json()
    }

    if (!data) {
      return Response.json({ error: 'Content not found' }, { status: 404 })
    }

    return Response.json(data, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=5, s-maxage=5',
      },
    })
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}
