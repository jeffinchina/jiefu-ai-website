'use client'
import { useState, useEffect } from 'react'

export function useContent(filePath: string) {
  const [content, setContent] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`/api/admin/content?file=${encodeURIComponent(filePath)}`)
      .then(r => r.ok ? r.json() : r.json().then(d => { throw new Error(d.error || `HTTP ${r.status}`) }))
      .then(d => {
        if (!cancelled) {
          setContent(d)
          setLoading(false)
        }
      })
      .catch(e => {
        if (!cancelled) {
          setError(e.message || '加载失败')
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [filePath])

  return { content, loading, error }
}
