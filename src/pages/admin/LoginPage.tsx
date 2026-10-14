import { Pizza } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button, Field, inputCls } from '../../components/ui'
import { useAuth } from '../../lib/auth'

export default function LoginPage() {
  const { user, login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/admin/pedidos" replace />

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError('')
    try { await login(email.trim(), password); nav('/admin/pedidos', { replace: true }) }
    catch (err) { setError((err as Error).message) }
    finally { setBusy(false) }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow">
        <div className="text-center">
          <Pizza className="mx-auto h-10 w-10 text-red-600" />
          <h1 className="mt-2 text-xl font-bold">Painel do restaurante</h1>
          <p className="text-sm text-zinc-500">Acesso restrito a administradores</p>
        </div>
        <Field label="E-mail"><input className={inputCls} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Senha"><input className={inputCls} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</div>}
        <Button type="submit" loading={busy} className="w-full">Entrar</Button>
      </form>
    </div>
  )
}
