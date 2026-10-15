import * as Dialog from '@radix-ui/react-dialog'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { Loader2, X } from 'lucide-react'
import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'

export const inputCls =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200'

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'danger' | 'ghost'; loading?: boolean }
export function Button({ variant = 'primary', loading, className = '', children, disabled, ...p }: BtnProps) {
  const styles = {
    primary: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-zinc-700 hover:bg-zinc-100',
  }[variant]
  return (
    <button {...p} disabled={disabled || loading}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

export function Field({ label, error, children, hint }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-zinc-700">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  )
}

export const Spinner = ({ className = '' }: { className?: string }) => (
  <div className={`flex justify-center p-8 ${className}`}><Loader2 className="h-6 w-6 animate-spin text-red-600" /></div>
)

export const ErrorBox = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
    {message}{onRetry && <button onClick={onRetry} className="ml-2 font-semibold underline">Tentar novamente</button>}
  </div>
)

export const Badge = ({ className = '', children }: { className?: string; children: ReactNode }) => (
  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>{children}</span>
)

/** Modal acessível (Radix Dialog): bottom-sheet no celular, centralizado no desktop. */
export function Modal({ open, onOpenChange, title, children, wide, scrollable }:
  { open: boolean; onOpenChange: (o: boolean) => void; title: string; children: ReactNode; wide?: boolean; scrollable?: boolean }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content aria-describedby={undefined}
          className={`fixed bottom-0 left-0 right-0 z-50 flex ${scrollable ? 'h-[92vh] h-[92dvh] w-full min-w-0' : 'max-h-[92vh] max-h-[92dvh]'} flex-col overflow-hidden rounded-t-2xl bg-white p-5 shadow-xl sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-1/2 sm:w-full sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}>
          <div className="mb-4 flex shrink-0 items-center justify-between gap-2">
            <Dialog.Title className="text-lg font-bold">{title}</Dialog.Title>
            <Dialog.Close className="rounded-full p-2 hover:bg-zinc-100" aria-label="Fechar"><X className="h-5 w-5" /></Dialog.Close>
          </div>
          <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/** Confirmação de ação destrutiva (Radix AlertDialog: foco preso, ESC cancela, leitores de tela). */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = 'Confirmar', onConfirm }:
  { open: boolean; onOpenChange: (o: boolean) => void; title: string; description: string; confirmLabel?: string; onConfirm: () => void }) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[60] bg-black/50" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[70] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-xl">
          <AlertDialog.Title className="text-lg font-bold">{title}</AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-zinc-600">{description}</AlertDialog.Description>
          <div className="mt-5 flex justify-end gap-2">
            <AlertDialog.Cancel asChild><Button variant="outline">Voltar</Button></AlertDialog.Cancel>
            <AlertDialog.Action asChild><Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button></AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}

// ---------- Toast mínimo ----------
type ToastItem = { id: number; msg: string; kind: 'ok' | 'err' }
const listeners = new Set<(t: ToastItem) => void>()
export const toast = (msg: string, kind: 'ok' | 'err' = 'ok') =>
  listeners.forEach((l) => l({ id: Date.now() + Math.random(), msg, kind }))

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([])
  useEffect(() => {
    const l = (t: ToastItem) => {
      setItems((x) => [...x, t])
      setTimeout(() => setItems((x) => x.filter((i) => i.id !== t.id)), 4500)
    }
    listeners.add(l)
    return () => { listeners.delete(l) }
  }, [])
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-3" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`pointer-events-auto max-w-md rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${t.kind === 'ok' ? 'bg-zinc-900' : 'bg-red-600'}`}>{t.msg}</div>
      ))}
    </div>
  )
}
