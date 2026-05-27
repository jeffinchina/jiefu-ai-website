export async function onRequestPost(context: { request: Request; env: Record<string, string> }) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  try {
    const form = await context.request.json() as { name: string; company: string; email: string; message: string }
    if (!form.name || !form.email || !form.message) {
      return Response.json({ error: '请填写姓名、邮箱和需求' }, { status: 400, headers: corsHeaders })
    }

    const ghToken = context.env.GITHUB_TOKEN || context.env.GH_TOKEN || ''
    const apiBase = 'https://api.github.com/repos/jeffinchina/jiefu-ai-website/contents/data/leads.json'

    // 1. Read current leads
    let leads: Record<string, unknown>[] = []
    let sha = ''
    if (ghToken) {
      const resp = await fetch(apiBase, {
        headers: { Authorization: `token ${ghToken}`, 'User-Agent': 'jiefu-ai' },
      })
      if (resp.ok) {
        const raw = await resp.json() as { sha: string; content: string }
        sha = raw.sha
        try {
          const decoded = atob(raw.content)
          leads = JSON.parse(decoded).leads || []
        } catch { /* keep empty */ }
      }
    }

    // 2. Add new lead
    leads.push({
      id: `lead-${Date.now()}`, seq: leads.length + 1,
      name: form.name, company: form.company || '', email: form.email,
      requirements: form.message, source: 'website', status: 'new', notes: '',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })

    // 3. Save
    if (ghToken) {
      const jsonStr = JSON.stringify({ leads }, null, 2) + '\n'
      const content = btoa(String.fromCharCode(...new TextEncoder().encode(jsonStr)))
      const payload: Record<string, unknown> = { message: `new lead: ${form.name}`, content, branch: 'main' }
      if (sha) payload.sha = sha
      await fetch(apiBase, {
        method: 'PUT',
        headers: { Authorization: `token ${ghToken}`, 'User-Agent': 'jiefu-ai', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }

    // 4. Email notification (best-effort)
    context.ctx?.waitUntil(sendEmail(form.name, form.company, form.email, form.message, context.env))

    return Response.json({ success: true, message: '提交成功，我们会尽快与您联系！' }, { headers: corsHeaders })
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500, headers: corsHeaders })
  }
}

async function sendEmail(name: string, company: string, email: string, message: string, env: Record<string, string>) {
  try {
    const adminEmail = env.NOTIFY_EMAIL || '652955942@qq.com'
    await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: adminEmail }] }],
        from: { email: 'noreply@lmrun.com', name: 'Jiefu AI' },
        subject: `[新咨询] ${name} - ${company || '未填公司'}`,
        content: [{ type: 'text/plain', value: `Jiefu AI 官网收到新咨询：\n\n姓名：${name}\n公司：${company || '未填写'}\n邮箱：${email}\n需求：${message}\n\n查看：https://lmrun.com/admin/leads` }],
      }),
    })
  } catch { /* best-effort */ }
}

export async function onRequestOptions() {
  return new Response(null, { headers: {
    'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type',
  }})
}
