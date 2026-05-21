'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Activity, FileText, RefreshCw, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const [status, setStatus] = useState('')
  const [history, setHistory] = useState<Array<{ sha: string; author: string; date: string; message: string }>>([])

  useEffect(() => {
    fetch('/api/admin/status').then(r => r.json()).then(d => setStatus(d.status || 'loading')).catch(() => {})
    fetch('/api/admin/history').then(r => r.json()).then(d => setHistory(d.history || [])).catch(() => {})
  }, [])

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">仪表盘</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/50">
          <div className="flex items-center gap-2 mb-1"><Activity size={16} className="text-[var(--accent)]" /><span className="text-sm text-[var(--foreground)]/50">构建状态</span></div>
          <span className={`text-lg font-semibold ${status === 'success' ? 'text-green-400' : 'text-yellow-400'}`}>{status === 'success' ? '在线' : status || '...'}</span>
        </div>
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/50">
          <div className="flex items-center gap-2 mb-1"><FileText size={16} className="text-[var(--accent)]" /><span className="text-sm text-[var(--foreground)]/50">内容管理</span></div>
          <Link href="/admin/editor" className="text-sm text-[var(--accent)] hover:underline flex items-center gap-1">打开编辑器 <ExternalLink size={12} /></Link>
        </div>
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/50">
          <div className="flex items-center gap-2 mb-1"><RefreshCw size={16} className="text-[var(--accent)]" /><span className="text-sm text-[var(--foreground)]/50">自动部署</span></div>
          <span className="text-lg font-semibold text-green-400">已启用</span>
        </div>
      </div>
      <h2 className="text-lg font-semibold mb-3">最近修改</h2>
      <div className="space-y-2">
        {history.slice(0, 10).map((h, i) => (
          <div key={i} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]/30">
            <div className="flex items-center justify-between">
              <span className="text-sm">{h.message}</span>
              <span className="text-xs text-[var(--foreground)]/40">{new Date(h.date).toLocaleString('zh-CN')}</span>
            </div>
          </div>
        ))}
        {history.length === 0 && <p className="text-sm text-[var(--foreground)]/40">暂无记录</p>}
      </div>
    </AdminLayout>
  )
}
