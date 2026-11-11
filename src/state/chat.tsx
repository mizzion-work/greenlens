import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { ChatMessage } from '../lib/chat'
import { askAssistant, type FailureCode } from '../server/functions'
import { useGarden } from './garden'

const STORAGE_KEY = 'greenlens:chat:v1'

export const CHAT_FAILURE: Record<FailureCode, string> = {
  'not-configured': 'ยังไม่ได้เชื่อมต่อ AI จึงยังตอบคำถามไม่ได้',
  'rate-limited': 'ถามถี่เกินไปนิด รอสักครู่แล้วลองใหม่นะคะ',
  busy: 'AI มีผู้ใช้งานจำนวนมาก ลองใหม่อีกครั้งในอีกสักครู่',
  quota: 'เครดิตบริการ AI หมดแล้ว ลองใหม่ภายหลัง',
  blocked: 'AI ตอบคำถามนี้ไม่ได้ ลองถามใหม่อีกแบบ',
  'no-image': 'AI ไม่ได้ตอบกลับมา ลองใหม่อีกครั้ง',
  'bad-input': 'รูปหรือข้อความไม่ถูกต้อง ลองใหม่อีกครั้ง',
  failed: 'เชื่อมต่อ AI ไม่สำเร็จ ลองใหม่อีกครั้ง',
}

function newId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

interface ChatContextValue {
  open: boolean
  messages: ChatMessage[]
  sending: boolean
  error: string | null
  /** Text to pre-fill in the input when the sheet opens. */
  draft: string
  setDraft: (text: string) => void
  openChat: (draft?: string) => void
  closeChat: () => void
  send: (text: string, image?: string) => Promise<void>
  clear: () => void
}

const ChatCtx = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const g = useGarden()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [hydrated, setHydrated] = useState(false)
  const messagesRef = useRef(messages)
  messagesRef.current = messages

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw) setMessages(JSON.parse(raw) as ChatMessage[])
    } catch {
      /* ignore */
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    } catch {
      // Photos can exceed the quota; keep the conversation text.
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.map(({ image: _i, ...m }) => m)))
      } catch {
        /* storage unavailable */
      }
    }
  }, [messages, hydrated])

  const send = useCallback(
    async (text: string, image?: string) => {
      const trimmed = text.trim()
      if (!trimmed && !image) return
      const userMsg: ChatMessage = { id: newId(), role: 'user', text: trimmed, image }
      const history = [...messagesRef.current, userMsg]
      setMessages(history)
      setError(null)

      if (!g.aiEnabled) {
        setError(CHAT_FAILURE['not-configured'])
        return
      }

      setSending(true)
      try {
        const hasSpace = Boolean(g.photo || g.plan)
        const r = await askAssistant({
          data: {
            messages: history,
            input: hasSpace ? g.input : undefined,
            planItems: g.plan?.items,
          },
        })
        if (r.ok) setMessages((m) => [...m, { id: newId(), role: 'model', text: r.text }])
        else setError(CHAT_FAILURE[r.code])
      } catch {
        setError(CHAT_FAILURE.failed)
      } finally {
        setSending(false)
      }
    },
    [g.aiEnabled, g.photo, g.plan, g.input],
  )

  const openChat = useCallback((d?: string) => {
    if (d !== undefined) setDraft(d)
    setOpen(true)
  }, [])
  const closeChat = useCallback(() => setOpen(false), [])
  const clear = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  const value = useMemo(
    () => ({ open, messages, sending, error, draft, setDraft, openChat, closeChat, send, clear }),
    [open, messages, sending, error, draft, openChat, closeChat, send, clear],
  )
  return <ChatCtx.Provider value={value}>{children}</ChatCtx.Provider>
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatCtx)
  if (!ctx) throw new Error('useChat must be used inside <ChatProvider>')
  return ctx
}
