'use client'

import { useState } from 'react'
import { Cpu, MonitorUp, Search, ArrowRight } from 'lucide-react'

type Mode = 'model-to-hardware' | 'hardware-to-model' | 'scenario'

interface ModelEntry {
  name: string; vram: string; ram: string; gpu: string; notes: string
}
interface HardwareEntry {
  gpu: string; vram: string; capable: string[]; notes: string
}

const modelDB: ModelEntry[] = [
  { name: 'Qwen 2.5 72B', vram: '48GB+', ram: '64GB+', gpu: '2x RTX 4090 / A6000', notes: 'Dual-GPU inference recommended' },
  { name: 'Llama 3 70B', vram: '48GB+', ram: '64GB+', gpu: '2x RTX 4090 / A6000', notes: '4-bit quantization can lower requirements' },
  { name: 'Qwen 2.5 7B', vram: '8GB+', ram: '16GB+', gpu: 'RTX 3060+', notes: 'Lightweight, single-GPU deployment' },
  { name: 'Llama 3 8B', vram: '8GB+', ram: '16GB+', gpu: 'RTX 3060+', notes: 'Best value option' },
  { name: 'DeepSeek V3', vram: '80GB+', ram: '128GB+', gpu: '4x A100 / 8x A6000', notes: 'Enterprise-grade hardware required' },
  { name: 'Mistral Large', vram: '48GB+', ram: '64GB+', gpu: '2x RTX 4090 / A6000', notes: 'European model' },
  { name: 'Coze/Dify Agents', vram: 'No GPU needed', ram: '8GB+', gpu: 'None', notes: 'Cloud solution, pay-per-use' },
]

const hardwareDB: HardwareEntry[] = [
  { gpu: 'No dedicated GPU', vram: 'Shared memory', capable: ['Coze/Dify Agents', 'Cloud API calls'], notes: 'Cloud API recommended' },
  { gpu: 'RTX 3060 12GB', vram: '12GB', capable: ['Qwen 2.5 7B', 'Llama 3 8B', 'Small models'], notes: 'Runs 7B-8B quantized models' },
  { gpu: 'RTX 4090 24GB', vram: '24GB', capable: ['Qwen 2.5 7B', 'Llama 3 8B', 'Mid-size (quantized)'], notes: 'Consumer flagship, ideal for small teams' },
  { gpu: 'Apple M3 Max 64GB', vram: 'Unified 64GB', capable: ['Qwen 2.5 72B (Q4)', 'Llama 3 70B (Q4)', 'Most open models'], notes: 'Mac solution, low power' },
  { gpu: 'A6000 48GB', vram: '48GB', capable: ['Qwen 2.5 72B', 'Llama 3 70B', 'Mistral Large'], notes: 'Professional grade, enterprise deployment' },
]

interface Props { dict: Record<string, unknown> }
type Dict = { pages: Record<string, string> }

export default function HardwareTool({ dict }: Props) {
  const d = dict as unknown as Dict
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<Mode | null>(null)
  const [results, setResults] = useState<ModelEntry[] | HardwareEntry[] | null>(null)
  const hints: string[] = d.pages.hardwareHints as unknown as string[] || ['Qwen 72B', 'RTX 4090', 'No GPU?', 'Budget $1K']

  function analyze() {
    const q = input.toLowerCase()
    const isModel = q.includes('qwen') || q.includes('llama') || q.includes('mistral') || q.includes('deepseek') || q.includes('模型') || q.includes('agent') || q.includes('gpt') || q.includes('claude')
    const isHardware = q.includes('rtx') || q.includes('gpu') || q.includes('内存') || q.includes('显卡') || q.includes('ram') || q.includes('mac') || q.includes('apple') || q.includes('a6000') || q.includes('我的设备') || q.includes('我有')

    if (isHardware && !isModel) {
      setMode('hardware-to-model')
      const matched = hardwareDB.filter(h => q.includes(h.gpu.toLowerCase()) || h.gpu.toLowerCase().split(' ').some(w => q.includes(w)))
      setResults(matched.length > 0 ? matched : hardwareDB)
    } else if (isModel && !isHardware) {
      setMode('model-to-hardware')
      const matched = modelDB.filter(m => m.name.toLowerCase().includes(q))
      setResults(matched.length > 0 ? matched : modelDB)
    } else {
      setMode('scenario')
      setResults(modelDB)
    }
  }

  const modeLabel: Record<Mode, string> = {
    'model-to-hardware': 'Model → Hardware',
    'hardware-to-model': 'Hardware → Capabilities',
    'scenario': 'Reference (provide more details for precise recommendation)',
  }

  return (
    <div className="pt-24 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <section className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 gradient-text">{d.pages.hardware || 'Hardware Advisor'}</h1>
          <p className="text-lg text-[var(--foreground)]/50 max-w-2xl mx-auto">{d.pages.hardwareSubtitle}</p>
        </section>

        <div className="mb-10 p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground)]/30" />
              <input
                value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && analyze()}
                placeholder={d.pages.hardwarePlaceholder}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
              />
            </div>
            <button onClick={analyze} className="px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white font-medium hover:opacity-90 transition-opacity flex items-center gap-2">
              <span>{d.pages.hardwareAnalyze}</span><ArrowRight size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-xs text-[var(--foreground)]/40">{d.pages.hardwareTry}</span>
            {hints.map((hint: string) => (
              <button key={hint} onClick={() => { setInput(hint); setTimeout(analyze, 100) }} className="text-xs px-2.5 py-1 rounded-full border border-[var(--border)] hover:border-[var(--primary)]/50 transition-colors text-[var(--foreground)]/50">{hint}</button>
            ))}
          </div>
        </div>

        {results && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              {mode === 'model-to-hardware' && <MonitorUp size={18} className="text-[var(--accent)]" />}
              {mode === 'hardware-to-model' && <Cpu size={18} className="text-[var(--accent)]" />}
              {mode === 'scenario' && <Search size={18} className="text-[var(--accent)]" />}
              <span className="text-sm font-medium">{mode ? modeLabel[mode] : ''}</span>
            </div>
            <div className="space-y-3">
              {Array.isArray(results) && results.map((item: ModelEntry | HardwareEntry, i: number) => (
                <div key={i} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/50">
                  {'gpu' in item && !('capable' in item) ? (
                    <>
                      <h3 className="font-semibold mb-2">{(item as ModelEntry).name}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div><span className="text-[var(--foreground)]/40">VRAM</span><p className="font-medium">{(item as ModelEntry).vram}</p></div>
                        <div><span className="text-[var(--foreground)]/40">RAM</span><p className="font-medium">{(item as ModelEntry).ram}</p></div>
                        <div><span className="text-[var(--foreground)]/40">GPU</span><p className="font-medium">{(item as ModelEntry).gpu}</p></div>
                        <div><span className="text-[var(--foreground)]/40">Notes</span><p className="font-medium">{(item as ModelEntry).notes}</p></div>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="font-semibold mb-2">{(item as HardwareEntry).gpu}</h3>
                      <div className="text-xs space-y-1">
                        <p><span className="text-[var(--foreground)]/40">Capable of: </span>{(item as HardwareEntry).capable.join(', ')}</p>
                        <p className="text-[var(--foreground)]/50">{(item as HardwareEntry).notes}</p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
