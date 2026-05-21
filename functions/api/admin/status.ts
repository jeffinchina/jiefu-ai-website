export async function onRequest(context: { env: Record<string, string> }) {
  try {
    const token = context.env.CLOUDFLARE_API_TOKEN || ''
    const accountId = '2c28a61c7b0d04a9a089ce6ce9e666ae'
    const projectName = 'jiefu-ai'

    const resp = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/deployments?per_page=3`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!resp.ok) {
      return Response.json({ status: 'unknown', error: '无法获取构建状态' })
    }
    const data = await resp.json() as { result?: Array<{ latest_stage?: { name: string; status: string }; created_on: string; url: string }> }
    const latest = data.result?.[0]
    return Response.json({
      status: latest?.latest_stage?.status === 'success' ? 'success' : latest?.latest_stage?.status || 'unknown',
      deployedAt: latest?.created_on,
      url: latest?.url,
    })
  } catch (e) {
    return Response.json({ status: 'unknown', error: (e as Error).message })
  }
}
