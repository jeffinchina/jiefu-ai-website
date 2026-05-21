'use client'

import { useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { useContent } from '@/components/admin/useContent'
import { Save, Plus, Trash2, ArrowUpDown, CheckCircle, AlertCircle } from 'lucide-react'

const TABS = ['业绩数据', '首页内容', '分支机构', '团队管理', '服务管理', '案例管理', '联系方式'] as const
type Tab = typeof TABS[number]

const FILES: Record<Tab, string> = {
  '业绩数据': 'content/zh-CN/common.json',
  '首页内容': 'content/zh-CN/home.json',
  '分支机构': 'content/zh-CN/common.json',
  '团队管理': 'content/zh-CN/team.json',
  '服务管理': 'content/zh-CN/services.json',
  '案例管理': 'content/zh-CN/cases.json',
  '联系方式': 'content/zh-CN/common.json',
}

function apiSave(file: string, data: unknown, token: string) {
  return fetch('/api/admin/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ file, content: data, message: `admin: update ${file}` }),
  }).then(r => r.json())
}

export default function EditorPage() {
  const [tab, setTab] = useState<Tab>('业绩数据')
  const { content, loading } = useContent(FILES[tab])
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') || '' : ''

  async function save(data: unknown) {
    setMsg(null)
    const file = FILES[tab]
    // For tabs that share common.json, use that
    const result = await apiSave(file, data, token)
    setMsg(result.error
      ? { type: 'err', text: result.error }
      : { type: 'ok', text: '保存成功！网站将在 2-3 分钟后更新。' }
    )
    setTimeout(() => setMsg(null), 4000)
  }

  return (
    <AdminLayout>
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {TABS.map(t => (
          <button key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === t ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface)] text-[var(--foreground)]/60 hover:text-[var(--foreground)]'}`}
          >{t}</button>
        ))}
      </div>

      {msg && (
        <div className={`mb-4 p-3 rounded-lg border text-sm flex items-center gap-2 ${msg.type === 'ok' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {msg.type === 'ok' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}{msg.text}
        </div>
      )}

      {loading ? <p className="text-sm text-[var(--foreground)]/40">加载中...</p> : content ? (
        <EditorPanel tab={tab} content={content} onSave={save} />
      ) : <p className="text-sm text-[var(--foreground)]/40">无法加载内容</p>}
    </AdminLayout>
  )
}

function EditorPanel({ tab, content, onSave }: { tab: Tab; content: Record<string, unknown>; onSave: (d: unknown) => void }) {
  const [data, setData] = useState(structuredClone(content))

  function update(path: string[], value: unknown) {
    setData((prev: Record<string, unknown>) => {
      const next = structuredClone(prev)
      let cur: Record<string, unknown> = next
      for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]] as Record<string, unknown>
      cur[path[path.length - 1]] = value
      return next
    })
  }

  const inputCls = "w-full px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]"
  const labelCls = "block text-xs font-medium text-[var(--foreground)]/60 mb-1"

  if (tab === '业绩数据') {
    const s = (data as Record<string, unknown>).stats as Record<string, number>
    return <div className="space-y-4 max-w-md">
      {[
        ['clientsServed', '企业客户数'], ['solutionsDelivered', '落地方案数'], ['personDaysSaved', '累计节省(人天)']
      ].map(([k, label]) => (
        <div key={k}>
          <label className={labelCls}>{label}</label>
          <input type="number" value={s[k]} onChange={e => update(['stats', k], parseInt(e.target.value) || 0)} className={inputCls} />
        </div>
      ))}
      <button onClick={() => onSave(data)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white text-sm"><Save size={14} />保存</button>
    </div>
  }

  if (tab === '首页内容') {
    const h = data as Record<string, unknown>
    const hero = h.hero as Record<string, string>
    const intro = h.intro as Record<string, string>
    const whyUs = h.whyUs as Record<string, unknown>
    const items = (whyUs.items as Array<Record<string, string>>) || []
    return <div className="space-y-6 max-w-2xl">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--accent)]">英雄区</h3>
        <div><label className={labelCls}>标题</label><input value={hero.title} onChange={e => update(['hero', 'title'], e.target.value)} className={inputCls} /></div>
        <div><label className={labelCls}>副标题</label><textarea value={hero.subtitle} onChange={e => update(['hero', 'subtitle'], e.target.value)} className={inputCls + ' h-20'} /></div>
        <div><label className={labelCls}>CTA按钮文案</label><input value={hero.cta} onChange={e => update(['hero', 'cta'], e.target.value)} className={inputCls} /></div>
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--accent)]">我们做什么</h3>
        <div><label className={labelCls}>标题</label><input value={intro.heading} onChange={e => update(['intro', 'heading'], e.target.value)} className={inputCls} /></div>
        <div><label className={labelCls}>描述</label><textarea value={intro.description} onChange={e => update(['intro', 'description'], e.target.value)} className={inputCls + ' h-20'} /></div>
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[var(--accent)]">为什么选择我们</h3>
        <div><label className={labelCls}>区块标题</label><input value={(whyUs.heading as string) || ''} onChange={e => update(['whyUs', 'heading'], e.target.value)} className={inputCls} /></div>
        {items.map((item, i) => (
          <div key={i} className="p-3 rounded-lg border border-[var(--border)] space-y-2">
            <div className="flex items-center justify-between"><span className="text-xs text-[var(--foreground)]/40">卡片 {i + 1}</span>
              <button onClick={() => { items.splice(i, 1); update(['whyUs', 'items'], [...items]) }} className="text-red-400"><Trash2 size={14} /></button>
            </div>
            <input value={item.title} onChange={e => { items[i].title = e.target.value; update(['whyUs', 'items'], [...items]) }} placeholder="标题" className={inputCls} />
            <textarea value={item.description} onChange={e => { items[i].description = e.target.value; update(['whyUs', 'items'], [...items]) }} placeholder="描述" className={inputCls + ' h-16'} />
          </div>
        ))}
        <button onClick={() => update(['whyUs', 'items'], [...items, { title: '', description: '' }])} className="text-xs text-[var(--accent)] flex items-center gap-1"><Plus size={12} />添加卡片</button>
      </div>
      <button onClick={() => onSave(data)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white text-sm"><Save size={14} />保存</button>
    </div>
  }

  if (tab === '分支机构') {
    const branches = (data as Record<string, unknown>).branches as Array<Record<string, string>>
    return <div className="space-y-4 max-w-2xl">
      {branches.map((b, i) => (
        <div key={i} className="p-4 rounded-lg border border-[var(--border)] space-y-2">
          <div className="flex items-center justify-between"><span className="text-sm font-semibold">{b.city || `分支 ${i + 1}`}</span>
            {branches.length > 1 && <button onClick={() => { branches.splice(i, 1); update(['branches'], [...branches]) }} className="text-red-400"><Trash2 size={14} /></button>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={labelCls}>城市</label><input value={b.city} onChange={e => { branches[i].city = e.target.value; update(['branches'], [...branches]) }} className={inputCls} /></div>
            <div><label className={labelCls}>国家</label><input value={b.country} onChange={e => { branches[i].country = e.target.value; update(['branches'], [...branches]) }} className={inputCls} /></div>
          </div>
          <div><label className={labelCls}>地址</label><input value={b.address} onChange={e => { branches[i].address = e.target.value; update(['branches'], [...branches]) }} className={inputCls} /></div>
          <div><label className={labelCls}>电话</label><input value={b.phone || ''} onChange={e => { branches[i].phone = e.target.value; update(['branches'], [...branches]) }} className={inputCls} /></div>
        </div>
      ))}
      <button onClick={() => update(['branches'], [...branches, { city: '', country: '', address: '', phone: '' }])} className="text-xs text-[var(--accent)] flex items-center gap-1"><Plus size={12} />添加分支</button>
      <button onClick={() => onSave(data)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white text-sm mt-4"><Save size={14} />保存</button>
    </div>
  }

  if (tab === '团队管理') {
    const members = (data as Record<string, unknown>).members as Array<Record<string, unknown>>
    return <div className="space-y-4 max-w-2xl">
      {members.map((m, i) => (
        <div key={i} className="p-4 rounded-lg border border-[var(--border)] space-y-2">
          <div className="flex items-center justify-between"><span className="text-sm font-semibold">{(m.name as string) || `成员 ${i + 1}`}</span>
            <button onClick={() => { members.splice(i, 1); update(['members'], [...members]) }} className="text-red-400"><Trash2 size={14} /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={labelCls}>姓名</label><input value={(m.name as string) || ''} onChange={e => { (members[i] as Record<string, unknown>).name = e.target.value; update(['members'], [...members]) }} className={inputCls} /></div>
            <div><label className={labelCls}>职务</label><input value={(m.title as string) || ''} onChange={e => { (members[i] as Record<string, unknown>).title = e.target.value; update(['members'], [...members]) }} className={inputCls} /></div>
          </div>
          <div><label className={labelCls}>照片URL</label><input value={(m.photo as string) || ''} onChange={e => { (members[i] as Record<string, unknown>).photo = e.target.value; update(['members'], [...members]) }} className={inputCls} placeholder="https://..." /></div>
          <div><label className={labelCls}>简介</label><textarea value={(m.bio as string) || ''} onChange={e => { (members[i] as Record<string, unknown>).bio = e.target.value; update(['members'], [...members]) }} className={inputCls + ' h-16'} /></div>
        </div>
      ))}
      <button onClick={() => update(['members'], [...members, { name: '', title: '', bio: '', photo: '', real: false }])} className="text-xs text-[var(--accent)] flex items-center gap-1"><Plus size={12} />添加成员</button>
      <button onClick={() => onSave(data)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white text-sm mt-4"><Save size={14} />保存</button>
    </div>
  }

  if (tab === '服务管理') {
    const services = (data as Record<string, unknown>).services as Array<Record<string, unknown>>
    return <div className="space-y-4 max-w-2xl">
      {services.map((s, i) => (
        <div key={i} className="p-4 rounded-lg border border-[var(--border)] space-y-2">
          <span className="text-sm font-semibold">{(s.title as string) || `服务 ${i + 1}`}</span>
          <div><label className={labelCls}>ID</label><input value={(s.id as string) || ''} onChange={e => { (services[i] as Record<string, unknown>).id = e.target.value; update(['services'], [...services]) }} className={inputCls} /></div>
          <div><label className={labelCls}>标题</label><input value={(s.title as string) || ''} onChange={e => { (services[i] as Record<string, unknown>).title = e.target.value; update(['services'], [...services]) }} className={inputCls} /></div>
          <div><label className={labelCls}>描述</label><textarea value={(s.description as string) || ''} onChange={e => { (services[i] as Record<string, unknown>).description = e.target.value; update(['services'], [...services]) }} className={inputCls + ' h-16'} /></div>
          <div><label className={labelCls}>功能列表（一行一个）</label>
            {((s.features as string[]) || []).map((f, j) => (
              <div key={j} className="flex gap-2"><input value={f} onChange={e => { (services[i] as Record<string, unknown>).features = [...(s.features as string[]).slice(0, j), e.target.value, ...(s.features as string[]).slice(j + 1)]; update(['services'], [...services]) }} className={inputCls} />
                <button onClick={() => { (services[i] as Record<string, unknown>).features = (s.features as string[]).filter((_: string, idx: number) => idx !== j); update(['services'], [...services]) }} className="text-red-400"><Trash2 size={14} /></button></div>
            ))}
            <button onClick={() => { (services[i] as Record<string, unknown>).features = [...(s.features as string[]), '']; update(['services'], [...services]) }} className="text-xs text-[var(--accent)] flex items-center gap-1"><Plus size={12} />添加功能</button>
          </div>
        </div>
      ))}
      <button onClick={() => onSave(data)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white text-sm mt-4"><Save size={14} />保存</button>
    </div>
  }

  if (tab === '案例管理') {
    const cases = (data as Record<string, unknown>).cases as Array<Record<string, string>>
    return <div className="space-y-4 max-w-2xl">
      {cases.map((c, i) => (
        <div key={i} className="p-4 rounded-lg border border-[var(--border)] space-y-2">
          <div className="flex items-center justify-between"><span className="text-sm font-semibold">{c.title?.slice(0, 30) || `案例 ${i + 1}`}</span>
            <button onClick={() => { cases.splice(i, 1); update(['cases'], [...cases]) }} className="text-red-400"><Trash2 size={14} /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={labelCls}>行业</label><input value={c.industry} onChange={e => { cases[i].industry = e.target.value; update(['cases'], [...cases]) }} className={inputCls} /></div>
            <div><label className={labelCls}>ID</label><input value={c.id} onChange={e => { cases[i].id = e.target.value; update(['cases'], [...cases]) }} className={inputCls} /></div>
          </div>
          <div><label className={labelCls}>标题</label><input value={c.title} onChange={e => { cases[i].title = e.target.value; update(['cases'], [...cases]) }} className={inputCls} /></div>
          <div><label className={labelCls}>挑战</label><textarea value={c.challenge} onChange={e => { cases[i].challenge = e.target.value; update(['cases'], [...cases]) }} className={inputCls + ' h-16'} /></div>
          <div><label className={labelCls}>方案</label><textarea value={c.solution} onChange={e => { cases[i].solution = e.target.value; update(['cases'], [...cases]) }} className={inputCls + ' h-16'} /></div>
          <div><label className={labelCls}>效果</label><textarea value={c.result} onChange={e => { cases[i].result = e.target.value; update(['cases'], [...cases]) }} className={inputCls + ' h-16'} /></div>
        </div>
      ))}
      <button onClick={() => update(['cases'], [...cases, { id: `case-${Date.now()}`, industry: '', title: '', challenge: '', solution: '', result: '' }])} className="text-xs text-[var(--accent)] flex items-center gap-1"><Plus size={12} />添加案例</button>
      <button onClick={() => onSave(data)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white text-sm mt-4"><Save size={14} />保存</button>
    </div>
  }

  if (tab === '联系方式') {
    const brand = (data as Record<string, unknown>).brand as Record<string, string>
    return <div className="space-y-4 max-w-md">
      <div><label className={labelCls}>邮箱</label><input value={brand.email} onChange={e => update(['brand', 'email'], e.target.value)} className={inputCls} /></div>
      <div><label className={labelCls}>微信</label><input value={brand.wechat || ''} onChange={e => update(['brand', 'wechat'], e.target.value)} className={inputCls} /></div>
      <div><label className={labelCls}>中文 Slogan</label><input value={brand.slogan} onChange={e => update(['brand', 'slogan'], e.target.value)} className={inputCls} /></div>
      <div><label className={labelCls}>英文 Slogan</label><input value={brand.sloganEn} onChange={e => update(['brand', 'sloganEn'], e.target.value)} className={inputCls} /></div>
      <button onClick={() => onSave(data)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white text-sm"><Save size={14} />保存</button>
    </div>
  }

  return null
}
