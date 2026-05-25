'use client'

import { useState, useEffect, useRef } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { useContent } from '@/components/admin/useContent'
import { Save, Plus, Trash2, CheckCircle, AlertCircle, Upload, X } from 'lucide-react'

const TABS = [
  { key: 'stats' as const, label: '业绩数据', file: 'content/zh-CN/common.json', section: 'stats' },
  { key: 'home' as const, label: '首页内容', file: 'content/zh-CN/home.json', section: null },
  { key: 'branches' as const, label: '分支机构', file: 'content/zh-CN/common.json', section: 'branches' },
  { key: 'team' as const, label: '团队管理', file: 'content/zh-CN/team.json', section: null },
  { key: 'services' as const, label: '服务管理', file: 'content/zh-CN/services.json', section: null },
  { key: 'cases' as const, label: '案例管理', file: 'content/zh-CN/cases.json', section: null },
  { key: 'contact' as const, label: '联系方式', file: 'content/zh-CN/common.json', section: 'brand' },
]
type TabKey = typeof TABS[number]['key']

function safeClone<T>(obj: T): T { try { return JSON.parse(JSON.stringify(obj)) } catch { return obj } }

export default function EditorPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('stats')
  const tab = TABS.find(t => t.key === activeTab)!
  const { content, loading, error } = useContent(tab.file)
  const [saving, setSaving] = useState(false)

  async function doSave(data: unknown) {
    setSaving(true)
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 15000)
    try {
      const token = localStorage.getItem('admin_token') || ''
      const res = await fetch('/api/admin/save', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ file: tab.file, content: data, message: `admin: update ${tab.label}` }), signal: ctrl.signal })
      const result = await res.json()
      return result.success ? { ok: true, text: '保存成功！刷新网站即可看到更新。' } : { ok: false, text: result.error || '保存失败' }
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') return { ok: false, text: '请求超时，请检查网络后重试' }
      return { ok: false, text: `网络错误：${(e as Error).message || '请重试'}` }
    } finally { clearTimeout(timer); setSaving(false) }
  }

  return (
    <AdminLayout>
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab === t.key ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface)] text-[var(--foreground)]/60 hover:text-[var(--foreground)]'}`}>{t.label}</button>
        ))}
      </div>
      {loading && <p className="text-sm text-[var(--foreground)]/40">加载中...</p>}
      {error && <p className="text-sm text-red-400">加载失败：{error}</p>}
      {!loading && !error && !content && <p className="text-sm text-[var(--foreground)]/40">暂无数据</p>}
      {!loading && content && (
        <EditorView key={activeTab} tabKey={activeTab} content={content} section={tab.section} onSave={doSave} saving={saving} />
      )}
    </AdminLayout>
  )
}

// Circular photo crop component
function PhotoCrop({ onSave, onCancel }: { onSave: (dataUrl: string) => void; onCancel: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [src, setSrc] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0, r: 80 })
  const imgRef = useRef<HTMLImageElement | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setSrc(reader.result as string)
    reader.readAsDataURL(file)
  }

  function handleMouseDown(e: React.MouseEvent) { setDragging(true) }
  function handleMouseUp() { setDragging(false) }
  function handleMouseMove(e: React.MouseEvent) {
    if (!dragging || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    setCrop(prev => ({ ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top }))
  }
  function handleWheel(e: React.WheelEvent) {
    e.preventDefault()
    setCrop(prev => ({ ...prev, r: Math.max(30, Math.min(150, prev.r - e.deltaY * 0.1)) }))
  }

  useEffect(() => {
    if (!src || !canvasRef.current) return
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      const canvas = canvasRef.current!
      canvas.width = 300; canvas.height = 300
      const ctx = canvas.getContext('2d')!
      // Draw image scaled to fit
      const scale = Math.min(300 / img.width, 300 / img.height)
      const iw = img.width * scale, ih = img.height * scale
      const ix = (300 - iw) / 2, iy = (300 - ih) / 2
      ctx.clearRect(0, 0, 300, 300)
      ctx.drawImage(img, ix, iy, iw, ih)
      // Crop circle indicator
      ctx.beginPath()
      ctx.arc(crop.x || 150, crop.y || 150, crop.r, 0, Math.PI * 2)
      ctx.strokeStyle = '#6c5ce7'; ctx.lineWidth = 3; ctx.stroke()
      // Darken outside circle
      ctx.beginPath(); ctx.rect(0, 0, 300, 300)
      ctx.arc(crop.x || 150, crop.y || 150, crop.r, 0, Math.PI * 2, true)
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fill()
    }
    img.src = src
  }, [src, crop])

  function saveCrop() {
    if (!imgRef.current) return
    const canvas = document.createElement('canvas')
    const size = 200
    canvas.width = size; canvas.height = size
    const ctx = canvas.getContext('2d')!
    // Draw cropped circle
    ctx.beginPath(); ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2); ctx.clip()
    const img = imgRef.current
    const scale = Math.min(300 / img.width, 300 / img.height)
    const iw = img.width * scale, ih = img.height * scale
    const ix = (300 - iw) / 2, iy = (300 - ih) / 2
    const sx = (crop.x || 150) - crop.r, sy = (crop.y || 150) - crop.r
    const s = crop.r * 2
    ctx.drawImage(img, sx / scale - ix / scale, sy / scale - iy / scale, s / scale, s / scale, 0, 0, size, size)
    onSave(canvas.toDataURL('image/jpeg', 0.85))
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={onCancel}>
      <div className="bg-[var(--surface)] rounded-2xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between mb-4"><h3 className="font-semibold">上传并裁剪照片</h3><button onClick={onCancel}><X size={18} /></button></div>
        {!src ? (
          <div className="text-center py-8">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFile} className="hidden" />
            <button onClick={() => fileRef.current?.click()} className="px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white text-sm"><Upload size={16} className="inline mr-2" />选择照片</button>
            <p className="text-xs text-[var(--foreground)]/40 mt-2">支持 JPG / PNG / WebP</p>
          </div>
        ) : (
          <div className="space-y-3">
            <canvas ref={canvasRef} className="w-full rounded-lg cursor-crosshair" onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove} onWheel={handleWheel} />
            <p className="text-xs text-[var(--foreground)]/40 text-center">拖拽移动位置 · 滚轮调整大小</p>
            <div className="flex gap-2">
              <button onClick={() => setSrc(null)} className="flex-1 py-2 rounded-lg border border-[var(--border)] text-sm">重选</button>
              <button onClick={saveCrop} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white text-sm">确认裁剪</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Confirmation dialog
function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={onCancel}>
      <div className="bg-[var(--surface)] rounded-2xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
        <p className="text-sm mb-4">{message}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2 rounded-lg border border-[var(--border)] text-sm">取消</button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm">确认删除</button>
        </div>
      </div>
    </div>
  )
}

const cls = "w-full px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)]"
const lbl = "block text-xs font-medium text-[var(--foreground)]/60 mb-1"

function EditorView({ tabKey, content, section, onSave, saving }: {
  tabKey: TabKey; content: Record<string, unknown>; section: string | null
  onSave: (d: unknown) => Promise<{ ok: boolean; text: string }>; saving: boolean
}) {
  const [data, setData] = useState(() => safeClone(content))
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [confirmDel, setConfirmDel] = useState<number | null>(null)
  const [cropIdx, setCropIdx] = useState<number | null>(null)

  useEffect(() => { setData(safeClone(content)); setMsg(null) }, [tabKey])

  function upd(path: string[], value: unknown) {
    setData(prev => {
      const next = safeClone(prev) as Record<string, unknown>
      let cur = next
      for (let i = 0; i < path.length - 1; i++) { if (!cur[path[i]] || typeof cur[path[i]] !== 'object') cur[path[i]] = {}; cur = cur[path[i]] as Record<string, unknown> }
      cur[path[path.length - 1]] = value
      return next
    })
  }

  async function handleSave() {
    setMsg(null)
    const result = await onSave(data)
    setMsg(result)
    setTimeout(() => setMsg(null), 5000)
  }

  function confirmDelete(idx: number | null, cb: () => void) {
    if (idx !== null && confirmDel === null) { setConfirmDel(idx); return }
    setConfirmDel(null)
    cb()
  }

  const SaveBtn = (
    <div>
      {msg && <div className={`mb-3 p-2.5 rounded-lg border text-xs flex items-center gap-2 ${msg.ok ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>{msg.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />}{msg.text}</div>}
      <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white text-sm disabled:opacity-50"><Save size={14} />{saving ? '保存中...' : '保存'}</button>
    </div>
  )

  // Stats
  if (section === 'stats') {
    const s = (data as Record<string, unknown>).stats as Record<string, number> | undefined
    if (!s) return <p className="text-sm text-red-400">stats 字段缺失</p>
    return <div className="space-y-4 max-w-md">
      <div><label className={lbl}>企业客户数</label><input type="number" value={s.clientsServed ?? 0} onChange={e => upd(['stats','clientsServed'], parseInt(e.target.value)||0)} className={cls} /></div>
      <div><label className={lbl}>落地方案数</label><input type="number" value={s.solutionsDelivered ?? 0} onChange={e => upd(['stats','solutionsDelivered'], parseInt(e.target.value)||0)} className={cls} /></div>
      <div><label className={lbl}>累计节省(人天)</label><input type="number" value={s.personDaysSaved ?? 0} onChange={e => upd(['stats','personDaysSaved'], parseInt(e.target.value)||0)} className={cls} /></div>
      {SaveBtn}
    </div>
  }

  // Branches
  if (section === 'branches') {
    const branches = ((data as Record<string,unknown>).branches || []) as Array<Record<string,string>>
    return <div className="space-y-4 max-w-2xl">
      {branches.map((b, i) => (
        <div key={i} className="p-4 rounded-lg border border-[var(--border)] space-y-2">
          <div className="flex items-center justify-between"><span className="text-sm font-semibold">{b.city || `分支${i+1}`}</span>
            {branches.length > 1 && <button onClick={() => confirmDelete(i, () => { branches.splice(i,1); upd(['branches'], [...branches]) })} className="text-red-400"><Trash2 size={14}/></button>}
          </div>
          <div className="grid grid-cols-2 gap-2"><div><label className={lbl}>城市</label><input value={b.city||''} onChange={e => { branches[i].city = e.target.value; upd(['branches'], [...branches]) }} className={cls}/></div><div><label className={lbl}>国家</label><input value={b.country||''} onChange={e => { branches[i].country = e.target.value; upd(['branches'], [...branches]) }} className={cls}/></div></div>
          <div><label className={lbl}>地址</label><input value={b.address||''} onChange={e => { branches[i].address = e.target.value; upd(['branches'], [...branches]) }} className={cls}/></div>
          <div><label className={lbl}>电话</label><input value={b.phone||''} onChange={e => { branches[i].phone = e.target.value; upd(['branches'], [...branches]) }} className={cls}/></div>
        </div>
      ))}
      <button onClick={() => upd(['branches'], [...branches, {city:'',country:'',address:'',phone:''}])} className="text-xs text-[var(--accent)] flex items-center gap-1"><Plus size={12}/>添加分支</button>
      {confirmDel !== null && <ConfirmDialog message={`确认删除「${branches[confirmDel]?.city || '此分支'}」？`} onConfirm={() => confirmDelete(null, () => { branches.splice(confirmDel!,1); upd(['branches'], [...branches]); setConfirmDel(null) })} onCancel={() => setConfirmDel(null)} />}
      {SaveBtn}
    </div>
  }

  // Brand
  if (section === 'brand') {
    const brand = ((data as Record<string,unknown>).brand || {}) as Record<string,string>
    return <div className="space-y-4 max-w-md">
      <div><label className={lbl}>中文品牌名</label><input value={brand.name||''} onChange={e => upd(['brand','name'], e.target.value)} className={cls}/></div>
      <div><label className={lbl}>英文品牌名</label><input value={brand.nameEn||''} onChange={e => upd(['brand','nameEn'], e.target.value)} className={cls}/></div>
      <div><label className={lbl}>邮箱</label><input value={brand.email||''} onChange={e => upd(['brand','email'], e.target.value)} className={cls}/></div>
      <div><label className={lbl}>微信</label><input value={brand.wechat||''} onChange={e => upd(['brand','wechat'], e.target.value)} className={cls}/></div>
      <div><label className={lbl}>中文 Slogan</label><input value={brand.slogan||''} onChange={e => upd(['brand','slogan'], e.target.value)} className={cls}/></div>
      <div><label className={lbl}>英文 Slogan</label><input value={brand.sloganEn||''} onChange={e => upd(['brand','sloganEn'], e.target.value)} className={cls}/></div>
      {SaveBtn}
    </div>
  }

  // Home
  if (tabKey === 'home') {
    const h = data as Record<string,unknown>
    const hero = (h.hero || {}) as Record<string,string>
    const intro = (h.intro || {}) as Record<string,string>
    const whyUs = (h.whyUs || {}) as Record<string,unknown>
    const items = (whyUs.items || []) as Array<Record<string,string>>
    return <div className="space-y-6 max-w-2xl">
      <fieldset className="p-4 rounded-lg border border-[var(--border)] space-y-3"><legend className="text-sm font-semibold text-[var(--accent)] px-1">英雄区</legend>
        <div><label className={lbl}>标题</label><input value={hero.title||''} onChange={e => upd(['hero','title'], e.target.value)} className={cls}/></div>
        <div><label className={lbl}>副标题</label><textarea value={hero.subtitle||''} onChange={e => upd(['hero','subtitle'], e.target.value)} className={cls+' h-20'}/></div>
        <div><label className={lbl}>CTA按钮</label><input value={hero.cta||''} onChange={e => upd(['hero','cta'], e.target.value)} className={cls}/></div>
      </fieldset>
      <fieldset className="p-4 rounded-lg border border-[var(--border)] space-y-3"><legend className="text-sm font-semibold text-[var(--accent)] px-1">我们做什么</legend>
        <div><label className={lbl}>标题</label><input value={intro.heading||''} onChange={e => upd(['intro','heading'], e.target.value)} className={cls}/></div>
        <div><label className={lbl}>描述</label><textarea value={intro.description||''} onChange={e => upd(['intro','description'], e.target.value)} className={cls+' h-20'}/></div>
      </fieldset>
      <fieldset className="p-4 rounded-lg border border-[var(--border)] space-y-3"><legend className="text-sm font-semibold text-[var(--accent)] px-1">为什么选择我们</legend>
        <div><label className={lbl}>区块标题</label><input value={(whyUs.heading as string)||''} onChange={e => upd(['whyUs','heading'], e.target.value)} className={cls}/></div>
        {items.map((item, i) => (
          <div key={i} className="p-3 rounded-lg border border-[var(--border)] space-y-2">
            <div className="flex justify-between"><span className="text-xs text-[var(--foreground)]/40">卡片{i+1}</span>
              <button onClick={() => confirmDelete(i, () => { items.splice(i,1); upd(['whyUs','items'], [...items]) })} className="text-red-400"><Trash2 size={14}/></button></div>
            <input value={item.title||''} onChange={e => { items[i].title = e.target.value; upd(['whyUs','items'], [...items]) }} placeholder="标题" className={cls}/>
            <textarea value={item.description||''} onChange={e => { items[i].description = e.target.value; upd(['whyUs','items'], [...items]) }} placeholder="描述" className={cls+' h-16'}/>
          </div>
        ))}
        <button onClick={() => upd(['whyUs','items'], [...items, {title:'',description:''}])} className="text-xs text-[var(--accent)] flex items-center gap-1"><Plus size={12}/>添加卡片</button>
      </fieldset>
      {confirmDel !== null && <ConfirmDialog message="确认删除此卡片？" onConfirm={() => confirmDelete(null, () => { items.splice(confirmDel!,1); upd(['whyUs','items'], [...items]); setConfirmDel(null) })} onCancel={() => setConfirmDel(null)} />}
      {SaveBtn}
    </div>
  }

  // Team
  if (tabKey === 'team') {
    const members = ((data as Record<string,unknown>).members || []) as Array<Record<string,unknown>>
    return <div className="space-y-4 max-w-2xl">
      {members.map((m, i) => (
        <div key={i} className="p-4 rounded-lg border border-[var(--border)] space-y-2">
          <div className="flex justify-between"><span className="text-sm font-semibold">{(m.name as string)||`成员${i+1}`}</span>
            <button onClick={() => confirmDelete(i, () => { members.splice(i,1); upd(['members'], [...members]) })} className="text-red-400"><Trash2 size={14}/></button></div>
          {/* Photo area */}
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[var(--border)] bg-[var(--background)] shrink-0">
              {(m.photo as string) ? <img src={m.photo as string} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[var(--foreground)]/20"><Upload size={20}/></div>}
            </div>
            <button onClick={() => setCropIdx(i)} className="text-xs text-[var(--accent)] hover:underline">上传照片</button>
          </div>
          <div className="grid grid-cols-2 gap-2"><div><label className={lbl}>姓名</label><input value={(m.name as string)||''} onChange={e => { (members[i] as Record<string,unknown>).name = e.target.value; upd(['members'], [...members]) }} className={cls}/></div><div><label className={lbl}>职务</label><input value={(m.title as string)||''} onChange={e => { (members[i] as Record<string,unknown>).title = e.target.value; upd(['members'], [...members]) }} className={cls}/></div></div>
          <div><label className={lbl}>简介</label><textarea value={(m.bio as string)||''} onChange={e => { (members[i] as Record<string,unknown>).bio = e.target.value; upd(['members'], [...members]) }} className={cls+' h-16'}/></div>
        </div>
      ))}
      <button onClick={() => upd(['members'], [...members, {name:'',title:'',bio:'',photo:'',real:false}])} className="text-xs text-[var(--accent)] flex items-center gap-1"><Plus size={12}/>添加成员</button>
      {cropIdx !== null && <PhotoCrop onSave={(dataUrl) => { (members[cropIdx] as Record<string,unknown>).photo = dataUrl; upd(['members'], [...members]); setCropIdx(null) }} onCancel={() => setCropIdx(null)} />}
      {confirmDel !== null && <ConfirmDialog message={`确认删除「${(members[confirmDel]?.name as string) || '此成员'}」？`} onConfirm={() => confirmDelete(null, () => { members.splice(confirmDel!,1); upd(['members'], [...members]); setConfirmDel(null) })} onCancel={() => setConfirmDel(null)} />}
      {SaveBtn}
    </div>
  }

  // Services
  if (tabKey === 'services') {
    const services = ((data as Record<string,unknown>).services || []) as Array<Record<string,unknown>>
    return <div className="space-y-4 max-w-2xl">
      {services.map((s, i) => (
        <div key={i} className="p-4 rounded-lg border border-[var(--border)] space-y-2">
          <div className="flex justify-between"><span className="text-sm font-semibold">{(s.title as string)||`服务${i+1}`}</span>
            <button onClick={() => confirmDelete(i, () => { services.splice(i,1); upd(['services'], [...services]) })} className="text-red-400"><Trash2 size={14}/></button></div>
          <div className="grid grid-cols-2 gap-2"><div><label className={lbl}>ID</label><input value={(s.id as string)||''} onChange={e => { (services[i] as Record<string,unknown>).id = e.target.value; upd(['services'], [...services]) }} className={cls}/></div><div><label className={lbl}>图标</label><input value={(s.icon as string)||''} onChange={e => { (services[i] as Record<string,unknown>).icon = e.target.value; upd(['services'], [...services]) }} className={cls}/></div></div>
          <div><label className={lbl}>标题</label><input value={(s.title as string)||''} onChange={e => { (services[i] as Record<string,unknown>).title = e.target.value; upd(['services'], [...services]) }} className={cls}/></div>
          <div><label className={lbl}>描述</label><textarea value={(s.description as string)||''} onChange={e => { (services[i] as Record<string,unknown>).description = e.target.value; upd(['services'], [...services]) }} className={cls+' h-16'}/></div>
          <div><label className={lbl}>功能列表</label>
            {((s.features as string[])||[]).map((f, j) => (
              <div key={j} className="flex gap-2"><input value={f} onChange={e => { const feats = [...(s.features as string[])]; feats[j] = e.target.value; (services[i] as Record<string,unknown>).features = feats; upd(['services'], [...services]) }} className={cls}/>
                <button onClick={() => { (services[i] as Record<string,unknown>).features = (s.features as string[]).filter((_, idx) => idx !== j); upd(['services'], [...services]) }} className="text-red-400"><Trash2 size={14}/></button></div>
            ))}
            <button onClick={() => { (services[i] as Record<string,unknown>).features = [...(s.features as string[]||[]), '']; upd(['services'], [...services]) }} className="text-xs text-[var(--accent)] flex items-center gap-1"><Plus size={12}/>添加功能</button></div>
        </div>
      ))}
      <button onClick={() => upd(['services'], [...services, {id:`svc-${Date.now()}`,title:'',description:'',icon:'Server',features:['']}])} className="text-xs text-[var(--accent)] flex items-center gap-1"><Plus size={12}/>添加服务卡片</button>
      {confirmDel !== null && <ConfirmDialog message={`确认删除「${(services[confirmDel]?.title as string) || '此服务'}」？`} onConfirm={() => confirmDelete(null, () => { services.splice(confirmDel!,1); upd(['services'], [...services]); setConfirmDel(null) })} onCancel={() => setConfirmDel(null)} />}
      {SaveBtn}
    </div>
  }

  // Cases
  if (tabKey === 'cases') {
    const cases = ((data as Record<string,unknown>).cases || []) as Array<Record<string,string>>
    return <div className="space-y-4 max-w-2xl">
      {cases.map((c, i) => (
        <div key={i} className="p-4 rounded-lg border border-[var(--border)] space-y-2">
          <div className="flex justify-between"><span className="text-sm font-semibold">{(c.title||'').slice(0,30)||`案例${i+1}`}</span>
            <button onClick={() => confirmDelete(i, () => { cases.splice(i,1); upd(['cases'], [...cases]) })} className="text-red-400"><Trash2 size={14}/></button></div>
          <div className="grid grid-cols-2 gap-2"><div><label className={lbl}>行业</label><input value={c.industry||''} onChange={e => { cases[i].industry = e.target.value; upd(['cases'], [...cases]) }} className={cls}/></div><div><label className={lbl}>ID</label><input value={c.id||''} onChange={e => { cases[i].id = e.target.value; upd(['cases'], [...cases]) }} className={cls}/></div></div>
          <div><label className={lbl}>标题</label><input value={c.title||''} onChange={e => { cases[i].title = e.target.value; upd(['cases'], [...cases]) }} className={cls}/></div>
          <div><label className={lbl}>挑战</label><textarea value={c.challenge||''} onChange={e => { cases[i].challenge = e.target.value; upd(['cases'], [...cases]) }} className={cls+' h-16'}/></div>
          <div><label className={lbl}>方案</label><textarea value={c.solution||''} onChange={e => { cases[i].solution = e.target.value; upd(['cases'], [...cases]) }} className={cls+' h-16'}/></div>
          <div><label className={lbl}>效果</label><textarea value={c.result||''} onChange={e => { cases[i].result = e.target.value; upd(['cases'], [...cases]) }} className={cls+' h-16'}/></div>
        </div>
      ))}
      <button onClick={() => upd(['cases'], [...cases, {id:`case-${Date.now()}`,industry:'',title:'',challenge:'',solution:'',result:''}])} className="text-xs text-[var(--accent)] flex items-center gap-1"><Plus size={12}/>添加案例</button>
      {confirmDel !== null && <ConfirmDialog message={`确认删除此案例？`} onConfirm={() => confirmDelete(null, () => { cases.splice(confirmDel!,1); upd(['cases'], [...cases]); setConfirmDel(null) })} onCancel={() => setConfirmDel(null)} />}
      {SaveBtn}
    </div>
  }

  return <p className="text-sm text-[var(--foreground)]/40">未知编辑类型: {tabKey}</p>
}
