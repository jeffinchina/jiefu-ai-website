// Cloudflare Pages Function: POST /api/admin/auth
import { SignJWT } from 'jose'

export async function onRequestPost(context: { request: Request; env: Record<string, string> }) {
  const { env } = context

  try {
    const { password } = await context.request.json()
    const storedHash = env.ADMIN_PASSWORD_HASH || ''

    // Rate limit check via KV
    let fails = 0
    if (env.ADMIN_LOG) {
      const existing = await env.ADMIN_LOG.get('rate_limit_fails', 'json') as { count: number; lockedUntil?: number } | null
      if (existing?.lockedUntil && Date.now() < existing.lockedUntil) {
        const waitMinutes = Math.ceil((existing.lockedUntil - Date.now()) / 60000)
        return Response.json({ error: `账户已锁定，${waitMinutes} 分钟后重试` }, { status: 429 })
      }
      fails = existing?.count || 0
    }

    // Verify password (simple comparison for now, upgrade to bcrypt later)
    const isValid = password === storedHash || password === (env.ADMIN_PASSWORD || '')

    if (!isValid) {
      fails++
      if (env.ADMIN_LOG) {
        const lockedUntil = fails >= 5 ? Date.now() + 15 * 60 * 1000 : undefined
        await env.ADMIN_LOG.put('rate_limit_fails', JSON.stringify({ count: fails, lockedUntil }))
      }
      return Response.json({ error: '密码错误' }, { status: 401 })
    }

    // Reset rate limit
    if (env.ADMIN_LOG) {
      await env.ADMIN_LOG.put('rate_limit_fails', JSON.stringify({ count: 0 }))
    }

    // Sign JWT
    const secret = new TextEncoder().encode(env.JWT_SECRET || 'default-secret-change-me')
    const token = await new SignJWT({ role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('4h')
      .sign(secret)

    return Response.json({ token })
  } catch {
    return Response.json({ error: '请求格式错误' }, { status: 400 })
  }
}
