// Cloudflare Pages Function: /api/chat

const KNOWLEDGE = `你是"小解"，解负智能(Jiefu AI)的AI助理，专门帮助中小微企业了解AI智能化服务。

公司信息：
- 品牌：解负智能(Jiefu AI)，Slogan"用智能武装每一个团队"(Arm every team with intelligence)
- 官网：lmrun.com | 邮箱：contact@lmrun.com
- 总部：南京，分支机构：深圳、香港、北京、新加坡

服务：
- AI智能化诊断(3,000-8,000元)：深入企业业务流程，识别最适合AI赋能的环节
- 智能体定制开发(5,000-20,000元)：基于实际业务场景定制专属AI智能体
- 工作流自动化(按人天1,500-2,500元)：用AI串联现有工具，打造自动化工作流
- 硬件适配顾问：根据AI需求推荐最优硬件配置方案

业绩：已服务50+企业客户 | 落地120+智能化解决方案 | 累计节省8,000+人天

核心团队：
- Jeff：创始人&CEO，南京大学毕业，AI落地实践者
- Dr. Alex Chen：CTO，卡内基梅隆大学博士，前硅谷AI研究员
- 王思涵：COO/客户成功负责人，十年企业咨询服务经验
- Marcus Okafor：海外业务拓展总监，伦敦商学院MBA

客户案例：
- 电商客服AI自动化：30人电商公司，客服从12人减到7人，年省48万
- 外贸邮件自动处理：8人团队效率提升300%，响应时间从4小时缩到15分钟
- 连锁餐饮排班采购：15家门店年省65万，食材损耗从12%降到5.3%

硬件适配知识：
- Qwen 2.5 72B：需48GB+显存，推荐2x RTX 4090或A6000双卡推理
- Llama 3 70B：需48GB+显存，可用4-bit量化降低需求
- Qwen 2.5 7B / Llama 3 8B：8GB显存即可，RTX 3060以上
- DeepSeek V3：需80GB+显存，企业级硬件
- 无显卡用户：推荐使用Coze/Dify等云端Agent平台+API调用
- Apple M3 Max 64GB：统一内存可跑大部分量化模型，功耗低

回复规则：
- 用用户的语言回复，保持热情专业、简洁有条理
- 每个回复控制在200字以内，除非用户主动要求详细说明
- 当用户问具体问题时，引用知识库中的准确数据
- 如果用户的问题超出知识库范围，建议他们联系contact@lmrun.com进行详细咨询
- 主动引导用户到相关页面了解更多`

export async function onRequest(context: { request: Request; env: Record<string, string> }) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { messages } = await context.request.json()
    const reply = await callLLM(messages, context.env) || fallbackReply(messages)
    return Response.json({ reply }, { headers: corsHeaders })
  } catch {
    return Response.json(
      { reply: 'Sorry, please email contact@lmrun.com and we will get back to you shortly.' },
      { headers: corsHeaders }
    )
  }
}

async function callLLM(
  messages: { role: string; content: string }[],
  env: Record<string, string>
): Promise<string | null> {
  const apiKey = env.ANTHROPIC_AUTH_TOKEN
  const baseUrl = env.ANTHROPIC_BASE_URL || 'https://api.deepseek.com/anthropic'

  if (!apiKey) {
    // Try DeepSeek direct API (free tier)
    try {
      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: KNOWLEDGE },
            ...messages.slice(-6),
          ],
          max_tokens: 300,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        return data.choices?.[0]?.message?.content || null
      }
    } catch { /* fall through */ }
    return null
  }

  // Anthropic-compatible API
  try {
    const res = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        max_tokens: 300,
        system: KNOWLEDGE,
        messages: messages.slice(-6),
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.content?.[0]?.text || null
  } catch {
    return null
  }
}

function fallbackReply(messages: { role: string; content: string }[]): string {
  const msg = (messages[messages.length - 1]?.content ?? '').toLowerCase()
  const zh = /[一-鿿]/.test(msg)

  if (msg.includes('价格') || msg.includes('收费') || msg.includes('price') || msg.includes('cost')) {
    return zh
      ? '我们的服务按项目复杂度定价：诊断评估3,000-8,000元，方案设计5,000-20,000元，开发落地按人天1,500-2,500元。预约免费初步咨询：contact@lmrun.com'
      : 'Our pricing: Diagnostics ¥3K-8K, Solution design ¥5K-20K, Implementation ¥1.5K-2.5K/person-day. Book a free consultation: contact@lmrun.com'
  }
  if (msg.includes('案例') || msg.includes('案例') || msg.includes('case')) {
    return zh
      ? '我们服务过电商、外贸、餐饮、法律、教育、房地产、制造、物流、医疗、财务等行业。典型案例：电商客服AI自动化(年省48万)、外贸邮件处理(效率+300%)、餐饮排班采购(年省65万)。访问官网/cases了解详情。'
      : 'Industries served: e-commerce, foreign trade, F&B, legal, education, real estate, manufacturing, logistics, healthcare, finance. Notable cases: e-commerce customer service (¥480K saved/yr), trade email processing (300% efficiency boost), restaurant scheduling (¥650K saved/yr). Visit /cases for details.'
  }
  if (msg.includes('联系') || msg.includes('contact') || msg.includes('微信') || msg.includes('email')) {
    return zh
      ? '📧 contact@lmrun.com | 🌐 lmrun.com | 💬 添加企业微信获取即时支持。您也可以在官网"联系我们"页面提交表单，我们24小时内回复。'
      : '📧 contact@lmrun.com | 🌐 lmrun.com | 💬 Add our WeCom for instant support. Or submit the form on our Contact page — we respond within 24 hours.'
  }
  if (msg.includes('硬件') || msg.includes('gpu') || msg.includes('配置') || msg.includes('hardware')) {
    return zh
      ? '根据您的需求：Qwen 7B/8B模型RTX 3060即可运行；Qwen 72B需双卡RTX 4090；无显卡推荐云端方案(Coze/Dify+API)。访问/hardware页面输入您的需求获取精准推荐。方便告诉我您想用什么模型或有什么设备吗？'
      : 'Recommendations: Qwen 7B/8B runs on RTX 3060; Qwen 72B needs dual RTX 4090; no GPU? Try cloud solutions (Coze/Dify + API). Visit /hardware and tell me your setup for a precise recommendation.'
  }
  if (msg.length < 5 || msg.includes('你好') || msg.includes('hi') || msg.includes('hello')) {
    return zh
      ? '您好！我是解负智能的AI助理小解 🎯 我可以帮您了解AI智能化服务、推荐解决方案、解答硬件配置问题、预约免费咨询。请问有什么可以帮您的？'
      : "Hi! I'm Xiao Jie, Jiefu AI's assistant 🎯 I can help you learn about our AI services, find solutions for your business, answer hardware questions, or book a free consultation. What can I help with?"
  }
  return zh
    ? '感谢您的咨询！如需详细了解，请发送邮件至 contact@lmrun.com 或访问官网"联系我们"页面。我们的顾问会在24小时内与您详细沟通。'
    : "Thanks for reaching out! For a detailed consultation, email contact@lmrun.com or visit our Contact page. Our advisors will get back to you within 24 hours."
}
