'use client'

import { useState, useEffect } from 'react'

export function useLiveContent<T>(locale: string, type: string, fallback: T | null): {
  content: T | null
  loading: boolean
  live: boolean
} {
  const file = `content/${locale}/${type}.json`
  const [content, setContent] = useState<T | null>(fallback)
  const [live, setLive] = useState(false)

  useEffect(() => {
    let cancelled = false

    fetch(`/api/content?file=${encodeURIComponent(file)}&t=${Date.now()}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!cancelled && data && !data.error) {
          setContent(data as T)
          setLive(true)
        }
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [file])

  return { content, loading: false, live }
}
