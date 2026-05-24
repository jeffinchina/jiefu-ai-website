'use client'

import { useState, useEffect } from 'react'

// Cache across component instances
const cache = new Map<string, { data: unknown; ts: number }>()
const CACHE_TTL = 15000 // 15 seconds

export function useLiveContent<T>(locale: string, type: string, fallback: T | null): {
  content: T | null
  loading: boolean
  live: boolean
} {
  const file = `content/${locale}/${type}.json`
  const cacheKey = file
  const cached = cache.get(cacheKey)

  const [content, setContent] = useState<T | null>(
    cached && Date.now() - cached.ts < CACHE_TTL ? cached.data as T : fallback
  )
  const [live, setLive] = useState(false)

  useEffect(() => {
    let cancelled = false

    fetch(`/api/content?file=${encodeURIComponent(file)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!cancelled && data && !data.error) {
          cache.set(cacheKey, { data, ts: Date.now() })
          setContent(data as T)
          setLive(true)
        }
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [file])

  return { content, loading: false, live }
}
