'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Plus, Save, Trash2, Search, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

interface Lead {
  id: string; seq: number; name: string; company: string; email: string
  requirements: string; source: string; status: string; notes: string
  createdAt: string; updatedAt: string
}

const STATUS_OPTIONS = ['new', 'contacted', 'in-progress', 'closed'] as const
const STATUS_LABELS: Record<string, string> = { new: '新咨询', contacted: '已联系', 'in-progress': '跟进中', closed: '已关闭' }
const STATUS_COLORS: Record<string, string> = { new: 'bg-blue-500/20 text-blue-400', contacted: 'bg-yellow-500/20 text-yellow-400', 'in-progress': 'bg-purple-500/20 text-purple-400', closed: 'bg-green-500/20 text-green-400' }

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [newLead, setNewLead] = useState({ name: '', company: '', email: '', requirements: '' })
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => { loadLeads() }, [])

  async function loadLeads() {
    setLoading(true)
    try {
      const res = await fetch('/api/leads-data')
      const data = await res.json()
      setLeads(data.leads || [])
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function saveLeads(updated: Lead[], msg_text: string) {
    const token = localStorage.getItem('admin_token') || ''
    try {
      const res = await fetch('/api/leads-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ leads: updated, message: msg_text }),
      })
      const data = await res.json()
      if (data.success) {
        setLeads(updated)
        setMsg({ ok: true, text: '保存成功！' })
      } else {
        setMsg({ ok: false, text: data.error || '保存失败' })
      }
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message })
    }
    setTimeout(() => setMsg(null), 4000)
  }

  function addLead() {
    if (!newLead.name || !newLead.email || !newLead.requirements) {
      setMsg({ ok: false, text: '请填写姓名、邮箱和需求' })
      return
    }
    const lead: Lead = {
      id: `lead-${Date.now()}`, seq: leads.length + 1,
      ...newLead, source: 'manual', status: 'new', notes: '',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }
    saveLeads([...leads, lead], 'admin: add lead manually')
    setNewLead({ name: '', company: '', email: '', requirements: '' })
    setShowAdd(false)
  }

  function updateField(id: string, field: keyof Lead, value: string) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, [field]: value, updatedAt: new Date().toISOString() } : l))
  }

  const filtered = leads.filter(l => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false
    if (search) {
      const s = search.toLowerCase()
      return (l.name + l.company + l.email + l.requirements).toLowerCase().includes(s)
    }
    return true
  })

  const th = "px-3 py-2 text-left text-xs font-medium text-[var(--foreground)]/40 uppercase tracking-wider"
  const td = "px-3 py-2 text-sm border-t border-[var(--border)]"

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">用户跟踪</h1>
        <div className="flex gap-2">
          <button onClick={loadLeads} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs hover:bg-white/5"><RefreshCw size={14} />刷新</button>
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs"><Plus size={14} />新建记录</button>
        </div>
      </div>

      {msg && (
        <div className={`mb-3 p-2.5 rounded-lg border text-xs flex items-center gap-2 ${msg.ok ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {msg.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />}{msg.text}
        </div>
      )}

      {/* Add new lead form */}
      {showAdd && (
        <div className="mb-4 p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]/30 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input placeholder="姓名*" value={newLead.name} onChange={e => setNewLead(p => ({ ...p, name: e.target.value }))} className="px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm" />
          <input placeholder="公司" value={newLead.company} onChange={e => setNewLead(p => ({ ...p, company: e.target.value }))} className="px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm" />
          <input placeholder="邮箱*" value={newLead.email} onChange={e => setNewLead(p => ({ ...p, email: e.target.value }))} className="px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm" />
          <button onClick={addLead} className="px-4 py-1.5 rounded-lg bg-[var(--primary)] text-white text-sm flex items-center justify-center gap-1"><Save size={14} />添加</button>
          <textarea placeholder="需求描述*" value={newLead.requirements} onChange={e => setNewLead(p => ({ ...p, requirements: e.target.value }))} className="col-span-full px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm h-16" />
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--foreground)]/30" />
          <input placeholder="搜索..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs">
          <option value="all">全部状态</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <span className="text-xs text-[var(--foreground)]/40 self-center">{filtered.length} 条记录</span>
      </div>

      {/* Table */}
      {loading ? <p className="text-sm text-[var(--foreground)]/40">加载中...</p> : (
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full">
            <thead><tr className="bg-[var(--surface)]/50">
              <th className={th} style={{ width: 50 }}>#</th>
              <th className={th}>姓名</th><th className={th}>公司</th><th className={th}>邮箱</th>
              <th className={th}>需求</th><th className={th}>来源</th><th className={th}>状态</th>
              <th className={th}>备注</th><th className={th} style={{ width: 60 }}></th>
            </tr></thead>
            <tbody>
              {filtered.map((l, i) => (
                <tr key={l.id} className="hover:bg-white/[0.02]">
                  <td className={td + ' text-[var(--foreground)]/30'}>{i + 1}</td>
                  <td className={td + ' font-medium'}>{l.name}</td>
                  <td className={td + ' text-[var(--foreground)]/60'}>{l.company || '-'}</td>
                  <td className={td + ' text-[var(--foreground)]/60'}>{l.email}</td>
                  <td className={td}><div className="max-w-[200px] truncate text-[var(--foreground)]/70" title={l.requirements}>{l.requirements}</div></td>
                  <td className={td}><span className={`text-xs px-1.5 py-0.5 rounded ${l.source === 'website' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-500/20 text-gray-400'}`}>{l.source === 'website' ? '网站' : '手动'}</span></td>
                  <td className={td}>
                    <select value={l.status} onChange={e => updateField(l.id, 'status', e.target.value)} className={`text-xs px-1.5 py-0.5 rounded cursor-pointer ${STATUS_COLORS[l.status] || ''}`}>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                  </td>
                  <td className={td}>
                    {editingId === l.id ? (
                      <input autoFocus value={l.notes} onChange={e => updateField(l.id, 'notes', e.target.value)} onBlur={() => setEditingId(null)} onKeyDown={e => { if (e.key === 'Enter') setEditingId(null) }} className="w-full px-2 py-0.5 rounded bg-[var(--background)] border border-[var(--border)] text-xs" />
                    ) : (
                      <div onClick={() => setEditingId(l.id)} className="text-xs text-[var(--foreground)]/40 cursor-pointer hover:text-[var(--foreground)]/60 min-w-[60px]">{l.notes || '点击备注...'}</div>
                    )}
                  </td>
                  <td className={td}>
                    <div className="flex gap-1">
                      <button onClick={() => saveLeads(leads, 'admin: update leads')} className="p-1 rounded hover:bg-white/5" title="保存"><Save size={14} className="text-[var(--accent)]" /></button>
                      <button onClick={() => { const updated = leads.filter(x => x.id !== l.id); saveLeads(updated, 'admin: delete lead') }} className="p-1 rounded hover:bg-white/5" title="删除"><Trash2 size={14} className="text-red-400" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-3 py-8 text-center text-sm text-[var(--foreground)]/30">暂无记录</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}
