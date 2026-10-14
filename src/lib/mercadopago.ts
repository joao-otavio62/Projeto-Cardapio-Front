/** Tokenização de cartão no navegador (SDK oficial do Mercado Pago). Os dados do cartão NUNCA passam pelo nosso backend. */
interface MPInstance {
  createCardToken(d: Record<string, string>): Promise<{ id: string }>
  getPaymentMethods(d: { bin: string }): Promise<{ results: { id: string }[] }>
}
declare global { interface Window { MercadoPago?: new (key: string, opts?: object) => MPInstance } }

let sdk: Promise<void> | null = null
function loadSdk() {
  sdk ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://sdk.mercadopago.com/js/v2'
    s.onload = () => resolve()
    s.onerror = () => { sdk = null; reject(new Error('Não foi possível carregar o módulo de pagamento.')) }
    document.head.appendChild(s)
  })
  return sdk
}

export type CardInput = { number: string; name: string; expiry: string; cvv: string; cpf: string }

export async function tokenizeCard(c: CardInput) {
  const key = import.meta.env.VITE_MP_PUBLIC_KEY as string | undefined
  if (!key) throw new Error('Pagamento por cartão indisponível (chave pública não configurada).')
  await loadSdk()
  const mp = new window.MercadoPago!(key, { locale: 'pt-BR' })

  const digits = c.number.replace(/\D/g, '')
  const [mm, yy] = c.expiry.split('/')
  const methods = await mp.getPaymentMethods({ bin: digits.slice(0, 6) })
  const paymentMethodId = methods.results[0]?.id
  if (!paymentMethodId) throw new Error('Bandeira do cartão não reconhecida.')

  const token = await mp.createCardToken({
    cardNumber: digits, cardholderName: c.name.trim(),
    cardExpirationMonth: mm, cardExpirationYear: yy.length === 2 ? `20${yy}` : yy, securityCode: c.cvv,
    identificationType: 'CPF', identificationNumber: c.cpf.replace(/\D/g, ''),
  })
  return { token: token.id, paymentMethodId }
}
