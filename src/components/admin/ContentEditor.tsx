'use client'

import { useState } from 'react'
import { Save, AlertCircle, CheckCircle } from 'lucide-react'

interface Props {
  title: string
  filePath: string
  initialContent: unknown
  children: (content: Record<string, unknown>, setField: (key: string, value: unknown) => void) => React.ReactNode
}

export default function ContentEditor({ title, filePath, initialContent, children }: Props) {
  const [content, setContent] = useState<Record<string, unknown>>(initialContent as Record<string, unknown>)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function setField(key: string, value: unknown) {
    setContent(prev => ({ ...prev, [key]: value }))
  }

  async function save() {
    setStatus('saving')
    setErrorMsg('')
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ file: filePath, content, message: `admin: update ${title}` }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('saved')
        setTimeout(() => setStatus('idle'), 3000)
      } else {
        setStatus('error')
        setErrorMsg(data.error || '保存失败')
      }
    } catch (e) {
      setStatus('error')
      setErrorMsg((e as Error).message)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <button onClick={save} disabled={status === 'saving'}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white text-sm font-medium disabled:opacity-50">
          {status === 'saving' ? '保存中...' : <><Save size={16} />保存并发布</>}
        </button>
      </div>

      {status === 'saved' && (
        <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2 text-sm text-green-400">
          <CheckCircle size={16} />保存成功！网站将在 2-3 分钟后更新。
        </div>
      )}
      {status === 'error' && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-sm text-red-400">
          <AlertCircle size={16} />{errorMsg}
        </div>
      )}

      <div className="space-y-6">
        {children(content, setField)}
      </div>
    </div>
  )
}
