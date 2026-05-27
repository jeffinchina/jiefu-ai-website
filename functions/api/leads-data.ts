// Admin endpoint: read/write leads data
// GET - read all leads (public, no auth needed for simplicity since data is non-sensitive)
// POST - admin: update/create leads (requires JWT)

async function verifyJWT(token: string, secret: string): Promise<boolean> {
  try {
    const { jwtVerify } = await import('jose')
    await jwtVerify(token, new TextEncoder().encode(secret))
    return true
  } catch { return false }
}

async function getLeads(token: string): Promise<{ leads: unknown[]; sha: string }> {
  const apiBase = 'https://api.github.com/repos/jeffinchina/jiefu-ai-website/contents/data/leads.json'
  const resp = await fetch(apiBase, {
    headers: { Authorization: `token ${token}`, 'User-Agent': 'jiefu-ai' },
  })
  if (!resp.ok) return { leads: [], sha: '' }
  const data = await resp.json() as { sha: string; content: string }
  return { leads: JSON.parse(atob(data.content)).leads || [], sha: data.sha }
}

export async function onRequestGet(context: { env: Record<string, string> }) {
  const token = context.env.GITHUB_TOKEN || context.env.GH_TOKEN || ''
  if (!token) return Response.json({ leads: [] })
  const { leads } = await getLeads(token)
  return Response.json({ leads }, { headers: { 'Access-Control-Allow-Origin': '*' } })
}

export async function onRequestPost(context: { request: Request; env: Record<string, string> }) {
  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }

  try {
    // Auth
    const authHeader = context.request.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    if (!(await verifyJWT(token, context.env.JWT_SECRET || 'default-secret'))) {
      return Response.json({ error: '未授权' }, { status: 401, headers: corsHeaders })
    }

    const body = await context.request.json() as { leads: unknown[]; message?: string }
    if (!Array.isArray(body.leads)) {
      return Response.json({ error: 'leads 必须是数组' }, { status: 400, headers: corsHeaders })
    }

    const ghToken = context.env.GITHUB_TOKEN || context.env.GH_TOKEN || ''
    if (!ghToken) return Response.json({ error: 'GitHub Token 未配置' }, { status: 500, headers: corsHeaders })

    const apiBase = 'https://api.github.com/repos/jeffinchina/jiefu-ai-website/contents/data/leads.json'
    const { sha } = await getLeads(ghToken)
    const jsonStr = JSON.stringify({ leads: body.leads }, null, 2) + '\n'
    const content = btoa(String.fromCharCode(...new TextEncoder().encode(jsonStr)))
    const payload: Record<string, unknown> = { message: body.message || 'admin: update leads', content, branch: 'main' }
    if (sha) payload.sha = sha

    const resp = await fetch(apiBase, {
      method: 'PUT',
      headers: { Authorization: `token ${ghToken}`, 'User-Agent': 'jiefu-ai', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!resp.ok) {
      const err = await resp.json() as { message: string }
      return Response.json({ error: `GitHub: ${err.message}` }, { status: 500, headers: corsHeaders })
    }
    return Response.json({ success: true }, { headers: corsHeaders })
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500, headers: corsHeaders })
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

// Use global btoa/atob in Workers runtime
