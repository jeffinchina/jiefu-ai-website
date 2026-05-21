'use client'
import { useState, useEffect } from 'react'

export function useContent(filePath: string) {
  const [content, setContent] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch current content from GitHub raw
    fetch(`https://raw.githubusercontent.com/jeffinchina/jiefu-ai-website/main/${filePath}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setContent(d); setLoading(false) })
      .catch(() => {
        // Fallback: try local file
        fetch(`/${filePath}`).then(r => r.ok ? r.json() : null).then(d => {
          setContent(d); setLoading(false)
        }).catch(() => setLoading(false))
      })
  }, [filePath])

  return { content, loading }
}
