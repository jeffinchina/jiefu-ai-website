const SYSTEM_PROMPT = `You are "小解" (Xiao Jie), the AI assistant for 解负智能 (Jiefu AI), a professional AI consulting company serving SMEs.

Company info:
- Slogan: "Arm every team with intelligence" (用智能武装每一个团队)
- Services: AI diagnostic assessment, custom agent development, workflow automation, hardware advisory
- Pricing: Diagnostics ¥3K-8K, Solution design ¥5K-20K, Implementation ¥20K-150K (at ¥1.5K-2.5K/person-day)
- HQ: Nanjing, with offices in Shenzhen, Hong Kong, Beijing, Singapore
- Contact: contact@lmrun.com | Website: lmrun.com
- 50+ enterprise clients, 120+ solutions delivered, 8,000+ person-days saved

Guidelines:
- Be warm, professional, and concise. Reply in the same language the user writes in.
- If user asks about pricing, give the exact ranges above.
- If user asks about cases, mention industries: e-commerce, foreign trade, F&B, legal, education, real estate, manufacturing, logistics, healthcare, finance.
- If user asks about hardware, guide them to the /hardware page.
- If user wants a consultation, guide them to /contact or email contact@lmrun.com.
- For greetings, introduce yourself briefly and offer to help.
- Keep responses under 200 characters unless the user asks for detail.
- Never make up specific client names or case details beyond what's listed above.`

export async function POST(request: Request) {
  try {
    const { messages } = await request.json()
    const userLang = extractLanguage(messages)

    // Try LLM API first
    const llmResponse = await callLLM(messages)
    if (llmResponse) {
      return Response.json({ reply: llmResponse })
    }

    // Fallback to rule-based
    return Response.json({ reply: fallbackReply(messages, userLang) })
  } catch {
    return Response.json({
      reply: 'Sorry, I cannot respond right now. Please email contact@lmrun.com and we will get back to you shortly.',
    })
  }
}

function extractLanguage(messages: { content: string }[]): string {
  const lastMsg = messages[messages.length - 1]?.content ?? ''
  if (/[一-鿿]/.test(lastMsg)) return 'zh'
  if (/[぀-ゟ゠-ヿ]/.test(lastMsg)) return 'ja'
  if (/[؀-ۿ]/.test(lastMsg)) return 'ar'
  return 'en'
}

async function callLLM(messages: { role: string; content: string }[]) {
  try {
    const res = await fetch(
      `${process.env.ANTHROPIC_BASE_URL || 'https://api.deepseek.com/anthropic'}/v1/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_AUTH_TOKEN || '',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'deepseek-v4-flash',
          max_tokens: 300,
          system: SYSTEM_PROMPT,
          messages: messages.slice(-6), // Last 6 messages for context
        }),
        signal: AbortSignal.timeout(8000),
      }
    )

    if (!res.ok) return null
    const data = await res.json()
    return data.content?.[0]?.text ?? null
  } catch {
    return null // Silently fall back to rule-based
  }
}

function fallbackReply(messages: { content: string }[], lang: string): string {
  const lastMsg = (messages[messages.length - 1]?.content ?? '').toLowerCase()

  if (lang === 'zh') {
    if (lastMsg.includes('价格') || lastMsg.includes('收费') || lastMsg.includes('多少钱')) {
      return '我们的服务根据项目复杂度定价：\n\n• 诊断评估：3,000-8,000 元\n• 方案设计：5,000-20,000 元\n• 开发落地：按人天 1,500-2,500 元\n\n预约免费初步咨询请联系 contact@lmrun.com。'
    }
    if (lastMsg.includes('案例') || lastMsg.includes('做过')) {
      return '我们服务过电商、外贸、餐饮、法律、教育、房地产、制造、物流、医疗、财务等多个行业。您可以浏览官网「案例」页面（/cases）了解详情。有特别关注的行业吗？'
    }
    if (lastMsg.includes('联系') || lastMsg.includes('微信') || lastMsg.includes('电话')) {
      return '您可以通过以下方式联系我们：\n\n📧 邮箱：contact@lmrun.com\n💬 微信：请添加企业微信\n🌐 官网「联系我们」页面提交表单\n\n我们会在 24 小时内回复。'
    }
    if (lastMsg.includes('硬件') || lastMsg.includes('配置') || lastMsg.includes('显卡') || lastMsg.includes('gpu')) {
      return '请访问我们的「硬件适配顾问」页面（/hardware），输入您的需求（模型/设备/预算），系统会自动推荐最优方案。需要我现在帮您分析吗？请告诉我您的情况。'
    }
    if (lastMsg.includes('你好') || lastMsg.includes('hi') || lastMsg.includes('hello') || lastMsg.length < 5) {
      return '您好！我是解负智能的 AI 助理小解 🎯\n\n我可以帮您：\n• 了解我们的 AI 智能化服务\n• 推荐适合您企业的解决方案\n• 解答硬件配置问题\n• 预约免费咨询\n\n请问有什么可以帮您的？'
    }
  }

  // English / other language fallback
  if (lastMsg.includes('price') || lastMsg.includes('cost') || lastMsg.includes('pricing') || lastMsg.includes('how much')) {
    return 'Our pricing by project complexity:\n\n• Diagnostic assessment: ¥3K-8K\n• Solution design: ¥5K-20K\n• Implementation: ¥1.5K-2.5K/person-day\n\nBook a free initial consultation at contact@lmrun.com.'
  }
  if (lastMsg.includes('case') || lastMsg.includes('example') || lastMsg.includes('portfolio')) {
    return 'We\'ve served e-commerce, foreign trade, F&B, legal, education, real estate, manufacturing, logistics, healthcare, and finance industries. Check out our Cases page (/cases) for details. Any industry in particular?'
  }
  if (lastMsg.includes('contact') || lastMsg.includes('email') || lastMsg.includes('phone') || lastMsg.includes('reach')) {
    return 'You can reach us at:\n\n📧 Email: contact@lmrun.com\n💬 WeChat: Add our WeCom account\n🌐 Submit the form on our Contact page\n\nWe respond within 24 hours.'
  }
  if (lastMsg.includes('hardware') || lastMsg.includes('gpu') || lastMsg.includes('spec')) {
    return 'Visit our Hardware Advisor page (/hardware) and tell us your needs (model/device/budget). Our system will recommend the optimal setup. Want me to help analyze now? Tell me your situation.'
  }
  if (lastMsg.includes('hi') || lastMsg.includes('hello') || lastMsg.includes('hey') || lastMsg.length < 5) {
    return "Hi! I'm Xiao Jie, Jiefu AI's assistant 🎯\n\nI can help you:\n• Learn about our AI services\n• Find solutions for your business\n• Answer hardware questions\n• Book a free consultation\n\nWhat can I help with?"
  }

  return lang === 'zh'
    ? '感谢您的咨询！为了更好地为您服务，请发送邮件至 contact@lmrun.com 或访问官网「联系我们」页面提交表单。我们的顾问会在 24 小时内与您详细沟通。'
    : "Thanks for reaching out! For a detailed consultation, please email contact@lmrun.com or submit the form on our Contact page. Our advisors will get back to you within 24 hours."
}
