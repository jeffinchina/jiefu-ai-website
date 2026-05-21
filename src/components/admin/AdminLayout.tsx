'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Home, MapPin, Users, Briefcase, FileText, Mail, LogOut, Menu } from 'lucide-react'
import Link from 'next/link'

const navItems = [
  { href: '/zh-CN/admin/dashboard', label: '仪表盘', icon: BarChart3 },
  { href: '/zh-CN/admin/stats', label: '业绩数据', icon: BarChart3 },
  { href: '/zh-CN/admin/home', label: '首页内容', icon: Home },
  { href: '/zh-CN/admin/branches', label: '分支机构', icon: MapPin },
  { href: '/zh-CN/admin/team', label: '团队管理', icon: Users },
  { href: '/zh-CN/admin/services', label: '服务管理', icon: Briefcase },
  { href: '/zh-CN/admin/cases', label: '案例管理', icon: FileText },
  { href: '/zh-CN/admin/contact', label: '联系方式', icon: Mail },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        if (payload.exp * 1000 > Date.now()) {
          setAuthed(true)
        }
      } catch { /* invalid token */ }
    }
    setLoading(false)
  }, [])

  function logout() {
    localStorage.removeItem('admin_token')
    window.location.href = '/zh-CN/admin'
  }

  if (loading) return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center"><div className="text-[var(--foreground)]/50">加载中...</div></div>
  if (!authed) {
    if (typeof window !== 'undefined') window.location.href = '/zh-CN/admin'
    return null
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-56 bg-[var(--surface)] border-r border-[var(--border)] transform transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static`}>
        <div className="p-4 border-b border-[var(--border)]">
          <h1 className="text-lg font-bold gradient-text">解负智能 后台</h1>
          <p className="text-xs text-[var(--foreground)]/40 mt-0.5">内容管理系统</p>
        </div>
        <nav className="p-3 space-y-0.5">
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-white/5 transition-colors"
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-[var(--border)]">
          <button onClick={logout} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-white/5 transition-colors w-full">
            <LogOut size={16} />退出登录
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--surface)]">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1"><Menu size={20} /></button>
          <span className="text-sm font-bold gradient-text">解负智能 后台</span>
          <button onClick={logout} className="p-1"><LogOut size={16} className="text-red-400" /></button>
        </div>
        <div className="p-4 md:p-8 max-w-4xl">
          {children}
        </div>
      </div>
    </div>
  )
}
