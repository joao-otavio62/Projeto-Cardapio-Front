import { ArrowLeft, CreditCard, QrCode, Store as StoreIcon, Truck } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button, Field, inputCls, toast } from '../../components/ui'
import { publicApi } from '../../lib/api'
import { useCart, useStore } from '../../lib/cart'
import { brl, isValidCpf, maskCep, maskCpf, maskPhone, onlyDigits } from '../../lib/format'
import { tokenizeCard } from '../../lib/mercadopago'
import type { CheckoutBody, DeliveryType, PaymentMethod } from '../../lib/types'

type Errors = Record<string, string>

export default function CheckoutPage() {
  const { slug, store } = useStore()
  const cart = useCart()
  const nav = useNavigate()

  const [f, setF] = useState({ name: '', cpf: '', phone: '', email: '', zip: '', street: '', number: '', complement: '', district: '', city: '', state: '' })
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' })
  const [delivery, setDelivery] = useState<DeliveryType>('Pickup')
  const [method, setMethod] = useState<PaymentMethod>('Pix')
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')

  if (cart.items.length === 0) return <Navigate to={`/loja/${slug}`} replace />

  const fee = delivery === 'Delivery' ? store.deliveryFee : 0
  const total = cart.subtotal + fee
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }))

  async function lookupCep(cep: string) {
    const d = onlyDigits(cep)
    if (d.length !== 8) return
    try {
      const r = await (await fetch(`https://viacep.com.br/ws/${d}/json/`)).json()
      if (!r.erro) setF((p) => ({ ...p, street: r.logradouro || p.street, district: r.bairro || p.district, city: r.localidade || p.city, state: r.uf || p.state }))
    } catch { /* preenchimento manual */ }
  }

  function validate(): Errors {
    const e: Errors = {}
    if (f.name.trim().length < 3) e.name = 'Informe seu nome completo.'
    if (!isValidCpf(f.cpf)) e.cpf = 'CPF inválido.'
    if (f.phone && ![10, 11].includes(onlyDigits(f.phone).length)) e.phone = 'Telefone inválido.'
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'E-mail inválido.'
    if (delivery === 'Delivery') {
      if (onlyDigits(f.zip).length !== 8) e.zip = 'CEP inválido.'
      if (!f.street.trim()) e.street = 'Informe a rua.'
      if (!f.number.trim()) e.number = 'Informe o número.'
      if (!f.district.trim()) e.district = 'Informe o bairro.'
      if (!f.city.trim()) e.city = 'Informe a cidade.'
      if (f.state.trim().length !== 2) e.state = 'UF com 2 letras.'
    }
    if (method === 'CreditCard') {
      if (onlyDigits(card.number).length < 13) e.cardNumber = 'Número inválido.'
      if (card.name.trim().length < 3) e.cardName = 'Nome como no cartão.'
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry)) e.expiry = 'Use MM/AA.'
      if (onlyDigits(card.cvv).length < 3) e.cvv = 'CVV inválido.'
    }
    return e
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault()
    setFormError('')
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) { toast('Confira os campos destacados.', 'err'); return }

    setBusy(true)
    try {
      let cardBody: CheckoutBody['card'] = null
      if (method === 'CreditCard') {
        const t = await tokenizeCard({ number: card.number, name: card.name, expiry: card.expiry, cvv: card.cvv, cpf: f.cpf })
        cardBody = { token: t.token, paymentMethodId: t.paymentMethodId, installments: 1, issuerId: null }
      }
      const res = await publicApi.checkout(slug, {
        fullName: f.name.trim(), cpf: onlyDigits(f.cpf), phone: onlyDigits(f.phone) || null, email: f.email.trim() || null,
        deliveryType: delivery, notes: null,
        address: delivery === 'Delivery'
          ? { zipCode: onlyDigits(f.zip), street: f.street.trim(), number: f.number.trim(), complement: f.complement.trim() || null, district: f.district.trim(), city: f.city.trim(), state: f.state.trim().toUpperCase() }
          : null,
        items: cart.items.map((i) => ({ productId: i.productId, quantity: i.qty, notes: i.notes.trim() || null })),
        paymentMethod: method, card: cardBody,
      })
      if (res.payment.status === 'Rejected' || res.status === 'Cancelled') {
        setFormError('Pagamento não aprovado. Confira os dados do cartão ou escolha PIX.')
        return
      }
      cart.clear()
      nav(`/loja/${slug}/pedido/${res.orderCode}`, { replace: true })
    } catch (err) {
      setFormError((err as Error).message)
    } finally { setBusy(false) }
  }

  const choice = (active: boolean) => `flex flex-1 flex-col items-center gap-1 rounded-xl border-2 p-3 text-sm font-semibold ${active ? 'border-red-600 bg-red-50 text-red-700' : 'border-zinc-200'}`

  return (
    <form onSubmit={submit} className="space-y-6 p-4" noValidate>
      <Link to={`/loja/${slug}/carrinho`} className="flex items-center gap-1 text-sm font-medium text-zinc-600"><ArrowLeft className="h-4 w-4" />Voltar ao carrinho</Link>
      <h1 className="text-xl font-bold">Finalizar pedido</h1>

      <section className="space-y-3">
        <h2 className="font-bold">1. Seus dados</h2>
        <Field label="Nome completo" error={errors.name}><input className={inputCls} value={f.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" /></Field>
        <Field label="CPF" error={errors.cpf}><input className={inputCls} inputMode="numeric" value={f.cpf} onChange={(e) => set('cpf', maskCpf(e.target.value))} placeholder="000.000.000-00" /></Field>
        <Field label="Celular (opcional)" error={errors.phone}><input className={inputCls} inputMode="tel" value={f.phone} onChange={(e) => set('phone', maskPhone(e.target.value))} autoComplete="tel" /></Field>
        <Field label="E-mail (opcional)" error={errors.email} hint="Usado pelo gateway de pagamento."><input className={inputCls} type="email" value={f.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" /></Field>
      </section>

      <section className="space-y-3">
        <h2 className="font-bold">2. Entrega</h2>
        <div className="flex gap-3">
          <button type="button" onClick={() => setDelivery('Pickup')} className={choice(delivery === 'Pickup')}><StoreIcon className="h-5 w-5" />Retirar no local<span className="text-xs font-normal">Grátis</span></button>
          <button type="button" onClick={() => setDelivery('Delivery')} className={choice(delivery === 'Delivery')}><Truck className="h-5 w-5" />Entrega<span className="text-xs font-normal">{brl(store.deliveryFee)}</span></button>
        </div>
        {delivery === 'Delivery' && (
          <div className="grid grid-cols-6 gap-3">
            <div className="col-span-6 sm:col-span-2"><Field label="CEP" error={errors.zip}><input className={inputCls} inputMode="numeric" value={f.zip} onChange={(e) => { const v = maskCep(e.target.value); set('zip', v); void lookupCep(v) }} /></Field></div>
            <div className="col-span-6 sm:col-span-4"><Field label="Rua" error={errors.street}><input className={inputCls} value={f.street} onChange={(e) => set('street', e.target.value)} /></Field></div>
            <div className="col-span-2"><Field label="Número" error={errors.number}><input className={inputCls} value={f.number} onChange={(e) => set('number', e.target.value)} /></Field></div>
            <div className="col-span-4"><Field label="Complemento"><input className={inputCls} value={f.complement} onChange={(e) => set('complement', e.target.value)} /></Field></div>
            <div className="col-span-6"><Field label="Bairro" error={errors.district}><input className={inputCls} value={f.district} onChange={(e) => set('district', e.target.value)} /></Field></div>
            <div className="col-span-4"><Field label="Cidade" error={errors.city}><input className={inputCls} value={f.city} onChange={(e) => set('city', e.target.value)} /></Field></div>
            <div className="col-span-2"><Field label="UF" error={errors.state}><input className={inputCls} maxLength={2} value={f.state} onChange={(e) => set('state', e.target.value.toUpperCase())} /></Field></div>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-bold">3. Pagamento</h2>
        <div className="flex gap-3">
          <button type="button" onClick={() => setMethod('Pix')} className={choice(method === 'Pix')}><QrCode className="h-5 w-5" />PIX</button>
          <button type="button" onClick={() => setMethod('CreditCard')} className={choice(method === 'CreditCard')}><CreditCard className="h-5 w-5" />Cartão de crédito</button>
        </div>
        {method === 'Pix' && <p className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600">O QR Code e o código “copia e cola” aparecem após confirmar. O pedido é enviado à loja assim que o PIX é pago.</p>}
        {method === 'CreditCard' && (
          <div className="space-y-3">
            <Field label="Número do cartão" error={errors.cardNumber}><input className={inputCls} inputMode="numeric" autoComplete="cc-number" value={card.number} onChange={(e) => setCard({ ...card, number: onlyDigits(e.target.value).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ') })} /></Field>
            <Field label="Nome impresso no cartão" error={errors.cardName}><input className={inputCls} autoComplete="cc-name" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value.toUpperCase() })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Validade" error={errors.expiry}><input className={inputCls} inputMode="numeric" placeholder="MM/AA" autoComplete="cc-exp" value={card.expiry} onChange={(e) => { const d = onlyDigits(e.target.value).slice(0, 4); setCard({ ...card, expiry: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d }) }} /></Field>
              <Field label="CVV" error={errors.cvv}><input className={inputCls} inputMode="numeric" autoComplete="cc-csc" value={card.cvv} onChange={(e) => setCard({ ...card, cvv: onlyDigits(e.target.value).slice(0, 4) })} /></Field>
            </div>
            <p className="text-xs text-zinc-500">🔒 Os dados do cartão são enviados direto ao Mercado Pago e não passam pelos nossos servidores.</p>
          </div>
        )}
      </section>

      <section className="space-y-1 rounded-xl bg-zinc-50 p-4 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>{brl(cart.subtotal)}</span></div>
        <div className="flex justify-between"><span>Entrega</span><span>{brl(fee)}</span></div>
        <div className="flex justify-between border-t pt-2 text-lg font-bold"><span>Total</span><span>{brl(total)}</span></div>
        <p className="text-xs text-zinc-500">Promoções vigentes são aplicadas pelo servidor na confirmação.</p>
      </section>

      {formError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{formError}</div>}
      <Button type="submit" loading={busy} className="w-full !min-h-12 text-base" disabled={!store.isOpen}>
        {method === 'Pix' ? 'Gerar PIX' : 'Pagar'} · {brl(total)}
      </Button>
    </form>
  )
}
