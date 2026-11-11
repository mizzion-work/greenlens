import { ImagePlus, LoaderCircle, MessageCircleQuestion, RotateCcw, SendHorizontal, Sparkles, X } from 'lucide-react'
import { Fragment, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { prepareImage } from '../client/image'
import { parseRichText, type Block } from '../lib/chat'
import { LIGHT_LABEL, SPACE_LABEL } from '../lib/plants'
import { FACING_LABEL } from '../lib/sun'
import { useGarden } from '../state/garden'
import { useChat } from '../state/chat'
import { AppIcon } from './art'

const SUGGESTIONS = [
  'มีต้นไม้อยู่แล้ว เอามาใช้กับพื้นที่นี้ได้ไหม?',
  'ไม่อยากซื้อใหม่ทุกต้น ควรเริ่มยังไงดี?',
  'ต้นไม้ใบเหลือง ควรทำยังไง?',
]

function RichText({ text }: { text: string }) {
  const render = (items: Block['items'][number]) =>
    items.map((part, i) => (part.bold ? <strong key={i}>{part.text}</strong> : <Fragment key={i}>{part.text}</Fragment>))
  return (
    <>
      {parseRichText(text).map((b, i) =>
        b.type === 'p' ? (
          <p key={i}>{render(b.items[0])}</p>
        ) : b.type === 'ul' ? (
          <ul key={i}>
            {b.items.map((it, j) => (
              <li key={j}>{render(it)}</li>
            ))}
          </ul>
        ) : (
          <ol key={i}>
            {b.items.map((it, j) => (
              <li key={j}>{render(it)}</li>
            ))}
          </ol>
        ),
      )}
    </>
  )
}

/** Floating "ถาม AI" button plus the bottom-sheet plant-advisor chat. */
export function ChatSheet() {
  const chat = useChat()
  const g = useGarden()
  const [image, setImage] = useState<string | null>(null)
  const [imgError, setImgError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chat.open) return
    const t = setTimeout(() => inputRef.current?.focus(), 250)
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && chat.closeChat()
    document.addEventListener('keydown', onKey)
    // On desktop the chat is a floating panel beside the page, so keep the page scrollable.
    const lock = window.matchMedia('(max-width: 1023px)').matches
    if (lock) document.body.style.overflow = 'hidden'
    return () => {
      clearTimeout(t)
      document.removeEventListener('keydown', onKey)
      if (lock) document.body.style.overflow = ''
    }
  }, [chat.open, chat.closeChat])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [chat.messages.length, chat.sending, chat.error, chat.open])

  async function attach(file: File | undefined) {
    if (!file) return
    setImgError(null)
    try {
      setImage((await prepareImage(file)).dataUrl)
    } catch {
      setImgError('เปิดรูปนี้ไม่ได้ ลองรูปอื่น')
    }
  }

  async function submit() {
    if (chat.sending) return
    const text = chat.draft
    if (!text.trim() && !image) return
    const img = image ?? undefined
    chat.setDraft('')
    setImage(null)
    await chat.send(text || 'ช่วยดูต้นไม้ในรูปนี้หน่อย ใช้กับพื้นที่ของฉันได้ไหม', img)
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      void submit()
    }
  }

  const spaceKnown = Boolean(g.photo || g.plan)
  const contextLine = spaceKnown
    ? [
        SPACE_LABEL[g.input.spaceType],
        g.input.facing ? `หัน${FACING_LABEL[g.input.facing]}` : null,
        LIGHT_LABEL[g.input.light],
        g.input.hasPets ? 'มีสัตว์เลี้ยง' : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : null

  return (
    <>
      {!chat.open && (
        <button type="button" className="chat-fab" onClick={() => chat.openChat()} aria-label="ถาม AI เรื่องต้นไม้">
          <MessageCircleQuestion size={20} />
          ถาม AI
        </button>
      )}

      {chat.open && (
        <>
          <div className="chat-backdrop" onClick={chat.closeChat} aria-hidden="true" />
          <section className="chat-sheet" role="dialog" aria-modal="true" aria-label="ผู้ช่วยต้นไม้ AI">
            <header className="chat-head">
              <AppIcon size={34} />
              <div>
                <b>ผู้ช่วยต้นไม้ AI</b>
                <small>{contextLine ? `รู้ว่าพื้นที่ของคุณ: ${contextLine}` : 'ถามเรื่องต้นไม้ที่มีอยู่แล้วได้เลย'}</small>
              </div>
              {chat.messages.length > 0 && (
                <button type="button" className="icon-btn" onClick={chat.clear} aria-label="เริ่มแชทใหม่" title="เริ่มแชทใหม่">
                  <RotateCcw size={18} />
                </button>
              )}
              <button
                type="button"
                className="icon-btn"
                style={chat.messages.length ? { marginLeft: 0 } : undefined}
                onClick={chat.closeChat}
                aria-label="ปิดแชท"
              >
                <X size={22} />
              </button>
            </header>

            <div className="chat-list" ref={listRef} aria-live="polite">
              <div className="bubble model">
                <p>
                  มีต้นไม้อยู่แล้วแต่ไม่รู้จะใช้ยังไง ถามได้เลยค่ะ เช่น เอามาวางตรงไหน รอดไหมกับแดดแบบนี้
                  หรือใช้แทนต้นที่แนะนำได้ไหม จะได้ไม่ต้องซื้อใหม่ทุกต้น แนบรูปต้นไม้ให้ดูได้ด้วยนะคะ
                </p>
              </div>

              {chat.messages.length === 0 && (
                <div className="chat-suggest">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} type="button" onClick={() => void chat.send(s)}>
                      {s}
                    </button>
                  ))}
                  <button type="button" onClick={() => fileRef.current?.click()}>
                    <ImagePlus size={14} /> ถ่ายรูปต้นไม้ที่มีให้ AI ดู
                  </button>
                </div>
              )}

              {chat.messages.map((m) => (
                <div key={m.id} className={`bubble ${m.role}`}>
                  {m.image && <img src={m.image} alt="รูปที่แนบ" />}
                  {m.role === 'model' ? <RichText text={m.text} /> : m.text && <p>{m.text}</p>}
                </div>
              ))}

              {chat.sending && (
                <div className="bubble model typing" role="status">
                  <span />
                  <span />
                  <span />
                  <span className="sr-only">AI กำลังตอบ</span>
                </div>
              )}
              {chat.error && <div className="chat-error">{chat.error}</div>}
            </div>

            <form
              className="chat-input"
              onSubmit={(e) => {
                e.preventDefault()
                void submit()
              }}
            >
              {(image || imgError) && (
                <div className="chat-attach">
                  {image && (
                    <>
                      <img src={image} alt="รูปที่จะส่ง" />
                      <button type="button" onClick={() => setImage(null)} aria-label="เอารูปออก">
                        <X size={14} />
                      </button>
                    </>
                  )}
                  {imgError && <span className="fine">{imgError}</span>}
                </div>
              )}
              <div className="chat-row">
                <button
                  type="button"
                  className="chat-tool"
                  onClick={() => fileRef.current?.click()}
                  aria-label="แนบรูปต้นไม้"
                  title="แนบรูปต้นไม้"
                >
                  <ImagePlus size={20} />
                </button>
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={chat.draft}
                  onChange={(e) => chat.setDraft(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="ถามเรื่องต้นไม้ของคุณ…"
                  maxLength={1000}
                  aria-label="พิมพ์คำถาม"
                />
                <button
                  type="submit"
                  className="chat-send"
                  disabled={chat.sending || (!chat.draft.trim() && !image)}
                  aria-label="ส่ง"
                >
                  {chat.sending ? <LoaderCircle size={19} className="animate-spin" /> : <SendHorizontal size={19} />}
                </button>
              </div>
              <p className="chat-note">
                <Sparkles size={11} /> คำตอบจาก AI อาจผิดพลาดได้ ใช้เป็นแนวทางประกอบการตัดสินใจ
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.heic,.heif"
                hidden
                onChange={(e) => {
                  void attach(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
            </form>
          </section>
        </>
      )}
    </>
  )
}
