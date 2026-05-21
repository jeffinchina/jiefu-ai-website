'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'
import { X, Send, Sparkles } from 'lucide-react'

interface Message { role: 'user' | 'assistant'; content: string }
interface AIPetProps { greeting: string; placeholder: string }

function PetMascot({ onClick }: { onClick: () => void }) {
  const [blinking, setBlinking] = useState(false)
  const [hovered, setHovered] = useState(false)
  const tiltX = useMotionValue(0)
  const springTiltX = useSpring(tiltX, { stiffness: 40, damping: 18 })
  const tiltY = useMotionValue(0)
  const springTiltY = useSpring(tiltY, { stiffness: 40, damping: 18 })

  // Blink cycle (faster when hovered)
  useEffect(() => {
    const blink = () => {
      setBlinking(true)
      setTimeout(() => setBlinking(false), 150)
    }
    const interval = hovered ? 1200 : 3000
    const schedule = () => setTimeout(() => { blink(); schedule() }, interval + Math.random() * interval * 0.5)
    const timer = schedule()
    return () => clearTimeout(timer)
  }, [hovered])

  // Mouse tilt (subtle leaning) — no position change, just rotation
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      tiltX.set((e.clientX - cx) / cx * 6)
      tiltY.set((e.clientY - cy) / cy * 4)
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [tiltX, tiltY])

  return (
    <motion.div
      className="fixed z-40 select-none"
      style={{ right: 24, bottom: 24, rotateX: springTiltY, rotateY: springTiltX }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.5, type: 'spring', stiffness: 200 }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Outer glow — brighter on hover */}
      <motion.div
        className="absolute -inset-3 rounded-full bg-gradient-to-r from-[var(--primary)]/30 to-[var(--accent)]/30 blur-2xl"
        animate={hovered
          ? { scale: [1, 1.3, 1], opacity: [0.3, 0.7, 0.3] }
          : { scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }
        }
        transition={{ duration: hovered ? 1.5 : 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Pet body */}
      <motion.div
        className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center shadow-xl shadow-[var(--primary)]/30 cursor-pointer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        animate={hovered
          ? { rotate: [-3, 3, -3], y: [0, -2, 0, 2, 0] }
          : { y: [0, -4, 0] }
        }
        transition={hovered
          ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 4, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        {/* Ears */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-3">
          <div className="w-2 h-2.5 rounded-full bg-[var(--accent)]/80" />
          <div className="w-2 h-2.5 rounded-full bg-[var(--primary)]/80" />
        </div>

        {/* Forehead sparkle */}
        <Sparkles size={10} className="absolute top-3 text-white/60" />

        {/* Eyes with pupils */}
        <div className="absolute flex gap-2 top-[18px]">
          <motion.div
            className="relative w-2.5 h-3 rounded-full bg-white flex items-center justify-center"
            animate={blinking ? { scaleY: 0.1 } : { scaleY: 1 }}
            transition={{ duration: 0.08 }}
          >
            <motion.div
              className="w-1 h-1.5 rounded-full bg-gray-900"
              animate={blinking ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: 0.08 }}
            />
          </motion.div>
          <motion.div
            className="relative w-2.5 h-3 rounded-full bg-white flex items-center justify-center"
            animate={blinking ? { scaleY: 0.1 } : { scaleY: 1 }}
            transition={{ duration: 0.08 }}
          >
            <motion.div
              className="w-1 h-1.5 rounded-full bg-gray-900"
              animate={blinking ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: 0.08 }}
            />
          </motion.div>
        </div>

        {/* Mouth */}
        <div className="absolute top-[27px] w-4 h-2 border-b-2 border-white/50 rounded-b-full" />

        {/* Blush */}
        <div className="absolute left-2 top-[24px] w-1.5 h-1 rounded-full bg-pink-400/30" />
        <div className="absolute right-2 top-[24px] w-1.5 h-1 rounded-full bg-pink-400/30" />
      </motion.div>
    </motion.div>
  )
}

export default function AIPet({ greeting, placeholder }: AIPetProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: greeting }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return
    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messages.concat(userMsg).map(m => ({ role: m.role, content: m.content })) }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I cannot reply right now. Please email contact@lmrun.com.' }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I cannot reply right now. Please email contact@lmrun.com.' }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages])

  return (
    <>
      <PetMascot onClick={() => setOpen(true)} />

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed z-50 right-4 bottom-24 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-8rem)] rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center">
                  <Sparkles size={14} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Jiefu AI · 小解</h3>
                  <p className="text-xs text-[var(--foreground)]/40">AI Assistant</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/5"><X size={18} /></button>
            </div>

            {/* Messages */}
            <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 overscroll-contain">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-xl text-sm whitespace-pre-wrap break-words leading-relaxed ${msg.role === 'user' ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white' : 'bg-white/5 text-[var(--foreground)]/80'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-1.5 px-4 py-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--foreground)]/30 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-[var(--foreground)]/30 animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <span className="w-2 h-2 rounded-full bg-[var(--foreground)]/30 animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              )}
            </div>

            {/* Input — fixed styling to avoid overlap */}
            <div className="shrink-0 px-4 py-3 border-t border-[var(--border)] bg-[var(--surface)]">
              <div className="flex gap-2 items-center">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder={placeholder}
                  className="flex-1 min-w-0 px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/30 focus:outline-none focus:border-[var(--primary)] transition-colors"
                  style={{ fontFamily: 'inherit', lineHeight: '1.5' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="shrink-0 p-2.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] disabled:opacity-30 transition-opacity"
                >
                  <Send size={16} className="text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
