export const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export const onlyDigits = (s: string) => s.replace(/\D/g, '')
export const fmtDate = (iso: string) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export function maskCpf(v: string) {
  const d = onlyDigits(v).slice(0, 11)
  let o = d.slice(0, 3)
  if (d.length > 3) o += '.' + d.slice(3, 6)
  if (d.length > 6) o += '.' + d.slice(6, 9)
  if (d.length > 9) o += '-' + d.slice(9, 11)
  return o
}
export function maskPhone(v: string) {
  const d = onlyDigits(v).slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}
export const maskCep = (v: string) => { const d = onlyDigits(v).slice(0, 8); return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d }

export function isValidCpf(v: string) {
  const d = onlyDigits(v)
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false
  const calc = (len: number) => {
    let s = 0
    for (let i = 0; i < len; i++) s += Number(d[i]) * (len + 1 - i)
    const r = (s * 10) % 11
    return r === 10 ? 0 : r
  }
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10])
}

export const toLocalInput = (iso: string) => {
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}
export const isoDate = (d: Date) => {
  const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10)
}
