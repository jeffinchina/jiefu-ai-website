'use client'

import { useEffect, useState, useRef } from 'react'
import type { CompanyStats } from '@/lib/content'

interface StatsCounterProps { stats: CompanyStats; locale: string }

function useCountUp(target: number, duration: number = 2000) {
  const [value, setValue] = useState(target)
  const prevTarget = useRef(target)
  const animFrame = useRef<number>(0)

  useEffect(() => {
    // If target didn't change, skip
    if (prevTarget.current === target && value === target) return
    prevTarget.current = target

    // Reset to 0 for re-animation
    setValue(0)

    const startTime = performance.now()
    function tick(time: number) {
      const elapsed = time - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * target))
      if (progress < 1) animFrame.current = requestAnimationFrame(tick)
    }
    // Small delay to let the reset to 0 render before animating up
    const timer = setTimeout(() => { animFrame.current = requestAnimationFrame(tick) }, 50)
    return () => { clearTimeout(timer); cancelAnimationFrame(animFrame.current) }
  }, [target, duration])

  return value
}

const labels: Record<string, string[]> = {
  'zh-CN': ['企业客户', '落地方案', '累计节省(人天)'],
  'zh-TW': ['企業客戶', '落地方案', '累計節省(人天)'],
  en: ['Enterprise Clients', 'Solutions Delivered', 'Person-Days Saved'],
}

export default function StatsCounter({ stats, locale }: StatsCounterProps) {
  const clients = useCountUp(stats.clientsServed, 1500)
  const solutions = useCountUp(stats.solutionsDelivered, 1800)
  const daysSaved = useCountUp(stats.personDaysSaved, 2000)

  const label = labels[locale] ?? labels['zh-CN']
  const values = [
    { value: clients, suffix: '+', label: label[0] },
    { value: solutions, suffix: '+', label: label[1] },
    { value: daysSaved, suffix: '+', label: label[2] },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {values.map((item, i) => (
        <div key={i} className="text-center p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50">
          <div className="text-4xl font-bold gradient-text mb-1">{item.value.toLocaleString()}{item.suffix}</div>
          <div className="text-sm text-[var(--foreground)]/50">{item.label}</div>
        </div>
      ))}
    </div>
  )
}
