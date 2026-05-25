'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { useContent } from '@/components/admin/useContent'
import { Save, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react'

const TABS = [
  { key: 'stats', label: '业绩数据', file: 'content/zh-CN/common.json', section: 'stats' },
  { key: 'home', label: '首页内容', file: 'content/zh-CN/home.json', section: null },
  { key: 'branches', label: '分支机构', file: 'content/zh-CN/common.json', section: 'branches' },
  { key: 'team', label: '团队管理', file: 'content/zh-CN/team.json', section: null },
  { key: 'services', label: '服务管理', file: 'content/zh-CN/services.json', section: null },
  { key: 'cases', label: '案例管理', file: 'content/zh-CN/cases.json', section: null },
  { key: 'contact', label: '联系方式', file: 'content/zh-CN/common.json', section: 'brand' },
] as const

type TabKey = typeof TABS[number]['key']

function safeClone<T>(obj: T): T {
  try { return JSON.parse(JSON.stringify(obj)) }
  catch { return obj }
}
const cls = "w-full px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]"
const lbl = "block text-xs font-medium text-[var(--foreground)]/60 mb-1"

export default function EditorPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('stats')
  const tab = TABS.find(t => t.key === activeTab)!

  const { content, loading, error } = useContent(tab.file)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  async function doSave(data: unknown) {
    setSaving(true)
    setMsg(null)
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 15000)
    try {
      const token = localStorage.getItem('admin_token') || ''
      const res = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ file: tab.file, content: data, message: `admin: update ${tab.label}` }),
        signal: ctrl.signal,
      })
      const result = await res.json()
      if (result.success) {
        setMsg({ type: 'ok', text: '保存成功！刷新网站页面即可看到更新。' })
      } else {
        setMsg({ type: 'err', text: result.error || '保存失败，请重试' })
      }
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        setMsg({ type: 'err', text: '请求超时，请检查网络后重试' })
      } else {
        setMsg({ type: 'err', text: `网络错误：${(e as Error).message || '请重试'}` })
      }
    } finally {
      clearTimeout(timer)
      setSaving(false)
      setTimeout(() => setMsg(null), 6000)
    }
  }

  return (
    <AdminLayout>
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab === t.key ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface)] text-[var(--foreground)]/60 hover:text-[var(--foreground)]'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {msg && (
        <div className={`mb-4 p-3 rounded-lg border text-sm flex items-center gap-2 ${msg.type === 'ok' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {msg.type === 'ok' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}{msg.text}
        </div>
      )}

      {loading && <p className="text-sm text-[var(--foreground)]/40">加载中...</p>}
      {error && <p className="text-sm text-red-400">加载失败：{error}</p>}
      {!loading && !error && !content && <p className="text-sm text-[var(--foreground)]/40">暂无数据</p>}

      {!loading && content && (
        <EditorView key={activeTab} tabKey={activeTab} tabLabel={tab.label} file={tab.file}
          initialContent={content} section={tab.section} onSave={doSave} saving={saving} />
      )}
    </AdminLayout>
  )
}

function EditorView({ tabKey, initialContent, section, onSave, saving }: {
  tabKey: TabKey; tabLabel: string; file: string
  initialContent: Record<string, unknown>; section: string | null; onSave: (d: unknown) => void; saving: boolean
}) {
  const [data, setData] = useState<Record<string, unknown>>(() => safeClone(initialContent))

  // Reset data when initialContent changes (tab switch, fresh load)
  useEffect(() => { setData(safeClone(initialContent)) }, [tabKey])

  function upd(path: string[], value: unknown) {
    setData(prev => {
      const next = safeClone(prev) as Record<string, unknown>
      let cur = next
      for (let i = 0; i < path.length - 1; i++) {
        if (!cur[path[i]] || typeof cur[path[i]] !== 'object') cur[path[i]] = {}
        cur = cur[path[i]] as Record<string, unknown>
      }
      cur[path[path.length - 1]] = value
      return next
    })
  }

  const Btn = (
    <button onClick={() => onSave(data)} disabled={saving}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white text-sm disabled:opacity-50">
      <Save size={14} />{saving ? '保存中...' : '保存'}
    </button>
  )

  // Shared editors that extract from common.json
  if (section === 'stats') {
    const s = (data as Record<string, unknown>).stats as Record<string, number> | undefined
    if (!s) return <p className="text-sm text-red-400">stats 字段缺失</p>
    return <div className="space-y-4 max-w-md">
      <div><label className={lbl}>企业客户数</label><input type="number" value={s.clientsServed ?? 0} onChange={e => upd(['stats','clientsServed'], parseInt(e.target.value)||0)} className={cls} /></div>
      <div><label className={lbl}>落地方案数</label><input type="number" value={s.solutionsDelivered ?? 0} onChange={e => upd(['stats','solutionsDelivered'], parseInt(e.target.value)||0)} className={cls} /></div>
      <div><label className={lbl}>累计节省(人天)</label><input type="number" value={s.personDaysSaved ?? 0} onChange={e => upd(['stats','personDaysSaved'], parseInt(e.target.value)||0)} className={cls} /></div>
      {Btn}
    </div>
  }

  if (section === 'branches') {
    const branches = ((data as Record<string, unknown>).branches || []) as Array<Record<string,string>>
    return <div className="space-y-4 max-w-2xl">
      {branches.map((b, i) => (
        <div key={i} className="p-4 rounded-lg border border-[var(--border)] space-y-2">
          <div className="flex items-center justify-between"><span className="text-sm font-semibold">{b.city || `分支${i+1}`}</span>
            {branches.length > 1 && <button onClick={() => { branches.splice(i,1); upd(['branches'], [...branches]) }} className="text-red-400"><Trash2 size={14}/></button>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={lbl}>城市</label><input value={b.city||''} onChange={e => { branches[i].city = e.target.value; upd(['branches'], [...branches]) }} className={cls}/></div>
            <div><label className={lbl}>国家</label><input value={b.country||''} onChange={e => { branches[i].country = e.target.value; upd(['branches'], [...branches]) }} className={cls}/></div>
          </div>
          <div><label className={lbl}>地址</label><input value={b.address||''} onChange={e => { branches[i].address = e.target.value; upd(['branches'], [...branches]) }} className={cls}/></div>
          <div><label className={lbl}>电话</label><input value={b.phone||''} onChange={e => { branches[i].phone = e.target.value; upd(['branches'], [...branches]) }} className={cls}/></div>
        </div>
      ))}
      <button onClick={() => upd(['branches'], [...branches, {city:'',country:'',address:'',phone:''}])} className="text-xs text-[var(--accent)] flex items-center gap-1"><Plus size={12}/>添加分支</button>
      {Btn}
    </div>
  }

  if (section === 'brand') {
    const brand = ((data as Record<string, unknown>).brand || {}) as Record<string,string>
    return <div className="space-y-4 max-w-md">
      <div><label className={lbl}>中文品牌名</label><input value={brand.name||''} onChange={e => upd(['brand','name'], e.target.value)} className={cls}/></div>
      <div><label className={lbl}>英文品牌名</label><input value={brand.nameEn||''} onChange={e => upd(['brand','nameEn'], e.target.value)} className={cls}/></div>
      <div><label className={lbl}>邮箱</label><input value={brand.email||''} onChange={e => upd(['brand','email'], e.target.value)} className={cls}/></div>
      <div><label className={lbl}>微信</label><input value={brand.wechat||''} onChange={e => upd(['brand','wechat'], e.target.value)} className={cls}/></div>
      <div><label className={lbl}>中文 Slogan</label><input value={brand.slogan||''} onChange={e => upd(['brand','slogan'], e.target.value)} className={cls}/></div>
      <div><label className={lbl}>英文 Slogan</label><input value={brand.sloganEn||''} onChange={e => upd(['brand','sloganEn'], e.target.value)} className={cls}/></div>
      {Btn}
    </div>
  }

  // Full file editors (home, team, services, cases)
  if (tabKey === 'home') {
    const d = data as Record<string, unknown>
    const hero = (d.hero || {}) as Record<string,string>
    const intro = (d.intro || {}) as Record<string,string>
    const whyUs = (d.whyUs || {}) as Record<string,unknown>
    const items = (whyUs.items || []) as Array<Record<string,string>>

    return <div className="space-y-6 max-w-2xl">
      <fieldset className="p-4 rounded-lg border border-[var(--border)] space-y-3">
        <legend className="text-sm font-semibold text-[var(--accent)] px-1">英雄区</legend>
        <div><label className={lbl}>标题</label><input value={hero.title||''} onChange={e => upd(['hero','title'], e.target.value)} className={cls}/></div>
        <div><label className={lbl}>副标题</label><textarea value={hero.subtitle||''} onChange={e => upd(['hero','subtitle'], e.target.value)} className={cls+' h-20'}/></div>
        <div><label className={lbl}>CTA按钮</label><input value={hero.cta||''} onChange={e => upd(['hero','cta'], e.target.value)} className={cls}/></div>
      </fieldset>
      <fieldset className="p-4 rounded-lg border border-[var(--border)] space-y-3">
        <legend className="text-sm font-semibold text-[var(--accent)] px-1">我们做什么</legend>
        <div><label className={lbl}>标题</label><input value={intro.heading||''} onChange={e => upd(['intro','heading'], e.target.value)} className={cls}/></div>
        <div><label className={lbl}>描述</label><textarea value={intro.description||''} onChange={e => upd(['intro','description'], e.target.value)} className={cls+' h-20'}/></div>
      </fieldset>
      <fieldset className="p-4 rounded-lg border border-[var(--border)] space-y-3">
        <legend className="text-sm font-semibold text-[var(--accent)] px-1">为什么选择我们</legend>
        <div><label className={lbl}>区块标题</label><input value={(whyUs.heading as string)||''} onChange={e => upd(['whyUs','heading'], e.target.value)} className={cls}/></div>
        {items.map((item, i) => (
          <div key={i} className="p-3 rounded-lg border border-[var(--border)] space-y-2">
            <div className="flex justify-between"><span className="text-xs text-[var(--foreground)]/40">卡片{i+1}</span>
              <button onClick={() => { items.splice(i,1); upd(['whyUs','items'], [...items]) }} className="text-red-400"><Trash2 size={14}/></button></div>
            <input value={item.title||''} onChange={e => { items[i].title = e.target.value; upd(['whyUs','items'], [...items]) }} placeholder="标题" className={cls}/>
            <textarea value={item.description||''} onChange={e => { items[i].description = e.target.value; upd(['whyUs','items'], [...items]) }} placeholder="描述" className={cls+' h-16'}/>
          </div>
        ))}
        <button onClick={() => upd(['whyUs','items'], [...items, {title:'',description:''}])} className="text-xs text-[var(--accent)] flex items-center gap-1"><Plus size={12}/>添加卡片</button>
      </fieldset>
      {Btn}
    </div>
  }

  if (tabKey === 'team') {
    const members = ((data as Record<string,unknown>).members || []) as Array<Record<string,unknown>>
    return <div className="space-y-4 max-w-2xl">
      {members.map((m, i) => (
        <div key={i} className="p-4 rounded-lg border border-[var(--border)] space-y-2">
          <div className="flex justify-between"><span className="text-sm font-semibold">{(m.name as string)||`成员${i+1}`}</span>
            <button onClick={() => { members.splice(i,1); upd(['members'], [...members]) }} className="text-red-400"><Trash2 size={14}/></button></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={lbl}>姓名</label><input value={(m.name as string)||''} onChange={e => { (members[i] as Record<string,unknown>).name = e.target.value; upd(['members'], [...members]) }} className={cls}/></div>
            <div><label className={lbl}>职务</label><input value={(m.title as string)||''} onChange={e => { (members[i] as Record<string,unknown>).title = e.target.value; upd(['members'], [...members]) }} className={cls}/></div>
          </div>
          <div><label className={lbl}>简介</label><textarea value={(m.bio as string)||''} onChange={e => { (members[i] as Record<string,unknown>).bio = e.target.value; upd(['members'], [...members]) }} className={cls+' h-16'}/></div>
        </div>
      ))}
      <button onClick={() => upd(['members'], [...members, {name:'',title:'',bio:'',photo:'',real:false}])} className="text-xs text-[var(--accent)] flex items-center gap-1"><Plus size={12}/>添加成员</button>
      {Btn}
    </div>
  }

  if (tabKey === 'services') {
    const services = ((data as Record<string,unknown>).services || []) as Array<Record<string,unknown>>
    return <div className="space-y-4 max-w-2xl">
      {services.map((s, i) => (
        <div key={i} className="p-4 rounded-lg border border-[var(--border)] space-y-2">
          <span className="text-sm font-semibold">{(s.title as string)||`服务${i+1}`}</span>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={lbl}>ID</label><input value={(s.id as string)||''} onChange={e => { (services[i] as Record<string,unknown>).id = e.target.value; upd(['services'], [...services]) }} className={cls}/></div>
            <div><label className={lbl}>图标</label><input value={(s.icon as string)||''} onChange={e => { (services[i] as Record<string,unknown>).icon = e.target.value; upd(['services'], [...services]) }} className={cls}/></div>
          </div>
          <div><label className={lbl}>标题</label><input value={(s.title as string)||''} onChange={e => { (services[i] as Record<string,unknown>).title = e.target.value; upd(['services'], [...services]) }} className={cls}/></div>
          <div><label className={lbl}>描述</label><textarea value={(s.description as string)||''} onChange={e => { (services[i] as Record<string,unknown>).description = e.target.value; upd(['services'], [...services]) }} className={cls+' h-16'}/></div>
          <div><label className={lbl}>功能列表</label>
            {((s.features as string[])||[]).map((f, j) => (
              <div key={j} className="flex gap-2">
                <input value={f} onChange={e => { const feats = [...(s.features as string[])]; feats[j] = e.target.value; (services[i] as Record<string,unknown>).features = feats; upd(['services'], [...services]) }} className={cls}/>
                <button onClick={() => { (services[i] as Record<string,unknown>).features = (s.features as string[]).filter((_, idx) => idx !== j); upd(['services'], [...services]) }} className="text-red-400"><Trash2 size={14}/></button></div>
            ))}
            <button onClick={() => { (services[i] as Record<string,unknown>).features = [...(s.features as string[]||[]), '']; upd(['services'], [...services]) }} className="text-xs text-[var(--accent)] flex items-center gap-1"><Plus size={12}/>添加功能</button></div>
        </div>
      ))}
      {Btn}
    </div>
  }

  if (tabKey === 'cases') {
    const cases = ((data as Record<string,unknown>).cases || []) as Array<Record<string,string>>
    return <div className="space-y-4 max-w-2xl">
      {cases.map((c, i) => (
        <div key={i} className="p-4 rounded-lg border border-[var(--border)] space-y-2">
          <div className="flex justify-between"><span className="text-sm font-semibold">{(c.title||'').slice(0,30)||`案例${i+1}`}</span>
            <button onClick={() => { cases.splice(i,1); upd(['cases'], [...cases]) }} className="text-red-400"><Trash2 size={14}/></button></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={lbl}>行业</label><input value={c.industry||''} onChange={e => { cases[i].industry = e.target.value; upd(['cases'], [...cases]) }} className={cls}/></div>
            <div><label className={lbl}>ID</label><input value={c.id||''} onChange={e => { cases[i].id = e.target.value; upd(['cases'], [...cases]) }} className={cls}/></div>
          </div>
          <div><label className={lbl}>标题</label><input value={c.title||''} onChange={e => { cases[i].title = e.target.value; upd(['cases'], [...cases]) }} className={cls}/></div>
          <div><label className={lbl}>挑战</label><textarea value={c.challenge||''} onChange={e => { cases[i].challenge = e.target.value; upd(['cases'], [...cases]) }} className={cls+' h-16'}/></div>
          <div><label className={lbl}>方案</label><textarea value={c.solution||''} onChange={e => { cases[i].solution = e.target.value; upd(['cases'], [...cases]) }} className={cls+' h-16'}/></div>
          <div><label className={lbl}>效果</label><textarea value={c.result||''} onChange={e => { cases[i].result = e.target.value; upd(['cases'], [...cases]) }} className={cls+' h-16'}/></div>
        </div>
      ))}
      <button onClick={() => upd(['cases'], [...cases, {id:`case-${Date.now()}`,industry:'',title:'',challenge:'',solution:'',result:''}])} className="text-xs text-[var(--accent)] flex items-center gap-1"><Plus size={12}/>添加案例</button>
      {Btn}
    </div>
  }

  return <p className="text-sm text-[var(--foreground)]/40">未知编辑类型: {tabKey}</p>
}
