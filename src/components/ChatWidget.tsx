import { MessageCircle, Send, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { publicApi } from '../lib/api'
import { inputCls, Button } from './ui'

type Msg = { role: 'user' | 'assistant'; content: string }
const GREETING: Msg = { role: 'assistant', content: 'Oi! 👋 Sou o assistente virtual. Me passe o código do seu pedido (ex.: PZ-7K3M9Q) e eu te conto o status.' }

export function ChatWidget({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([GREETING])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, open])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    const content = text.trim()
    if (!content || busy) return
    const next = [...msgs, { role: 'user', content } as Msg]
    setMsgs(next); setText(''); setBusy(true)
    try {
      const { reply } = await publicApi.chat(slug, next.slice(1)) // não envia a saudação local
      setMsgs([...next, { role: 'assistant', content: reply }])
    } catch (err) {
      setMsgs([...next, { role: 'assistant', content: (err as Error).message }])
    } finally { setBusy(false) }
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} aria-label="Abrir assistente virtual"
      className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg">
      <MessageCircle className="h-6 w-6" />
    </button>
  )
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex h-[75vh] flex-col rounded-t-2xl bg-white shadow-2xl sm:inset-x-auto sm:bottom-4 sm:right-4 sm:h-[32rem] sm:w-96 sm:rounded-2xl">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <strong>Assistente de pedidos</strong>
        <button onClick={() => setOpen(false)} aria-label="Fechar chat" className="rounded-full p-2 hover:bg-zinc-100"><X className="h-5 w-5" /></button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {msgs.map((m, i) => (
          <div key={i} className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${m.role === 'user' ? 'ml-auto bg-red-600 text-white' : 'bg-zinc-100'}`}>{m.content}</div>
        ))}
        {busy && <div className="w-16 rounded-2xl bg-zinc-100 px-3 py-2 text-sm text-zinc-500">…</div>}
        <div ref={end} />
      </div>
      <form onSubmit={send} className="flex gap-2 border-t p-3">
        <input className={inputCls} value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="Digite sua mensagem" />
        <Button type="submit" disabled={busy || !text.trim()} aria-label="Enviar"><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  )
}
