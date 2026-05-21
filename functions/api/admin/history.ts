export async function onRequest(context: { request: Request; env: Record<string, string> }) {
  const token_gh = context.env.GITHUB_TOKEN || context.env.GH_TOKEN || ''
  if (!token_gh) {
    return Response.json({ error: 'GitHub Token 未配置' }, { status: 500 })
  }

  try {
    const resp = await fetch(
      'https://api.github.com/repos/jeffinchina/jiefu-ai-website/commits?path=content&per_page=20',
      { headers: { Authorization: `token ${token_gh}`, 'User-Agent': 'jiefu-ai-admin' } }
    )
    if (!resp.ok) {
      return Response.json({ error: 'GitHub API 错误' }, { status: 500 })
    }
    const commits = await resp.json() as Array<{
      sha: string; html_url: string;
      commit: { author: { name: string; date: string }; message: string }
    }>
    const history = commits.slice(0, 20).map(c => ({
      sha: c.sha.slice(0, 7),
      author: c.commit.author.name,
      date: c.commit.author.date,
      message: c.commit.message,
      url: c.html_url,
    }))
    return Response.json({ history })
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }
}
