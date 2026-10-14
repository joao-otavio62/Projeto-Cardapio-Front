import { Minus, Plus } from 'lucide-react'

export function QtyStepper({ qty, onChange }: { qty: number; onChange: (q: number) => void }) {
  return (
    <div className="inline-flex items-center rounded-lg border border-zinc-300 bg-white">
      <button type="button" aria-label="Diminuir" onClick={() => onChange(qty - 1)} className="flex h-10 w-10 items-center justify-center"><Minus className="h-4 w-4" /></button>
      <span className="w-8 text-center font-semibold" aria-live="polite">{qty}</span>
      <button type="button" aria-label="Aumentar" onClick={() => onChange(qty + 1)} className="flex h-10 w-10 items-center justify-center"><Plus className="h-4 w-4" /></button>
    </div>
  )
}
