import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

export function RegisterForm({ onNavigateToLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)
    const { error: authError } = await supabase.auth.signUp({ email, password })
    setLoading(false)

    if (authError) {
      setError(authError.message)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-md bg-dark-card rounded-2xl shadow-2xl p-5 sm:p-8 border border-border-dark text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-accent mb-2">¡Casi listo!</h2>
        <p className="text-accent-light/70 text-sm mb-6">
          Revisa tu correo <span className="text-accent-light font-medium">{email}</span> y confirma tu cuenta.
        </p>
        <Button variant="ghost" onClick={onNavigateToLogin}>
          Volver al inicio de sesión
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md bg-dark-card rounded-2xl shadow-2xl p-5 sm:p-8 border border-border-dark">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-accent tracking-tight">
          BackToZero
        </h1>
        <p className="mt-2 text-accent-light/60 text-sm">
          Crea tu cuenta y empieza desde cero
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
          {error}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <Input
          id="reg-email"
          label="Correo electrónico"
          type="email"
          placeholder="tucorreo@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          id="reg-password"
          label="Contraseña"
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Input
          id="reg-confirm"
          label="Confirmar contraseña"
          type="password"
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />

        <Button type="submit" loading={loading}>
          Crear cuenta
        </Button>
      </form>

      <div className="flex items-center my-6">
        <div className="flex-1 border-t border-border-dark/50" />
        <span className="px-3 text-accent-light/30 text-sm">o</span>
        <div className="flex-1 border-t border-border-dark/50" />
      </div>

      <p className="text-center text-accent-light/50 text-sm">
        ¿Ya tienes cuenta?{' '}
        <button
          type="button"
          onClick={onNavigateToLogin}
          className="text-accent font-semibold hover:text-accent-hover transition-colors duration-200"
        >
          Inicia sesión
        </button>
      </p>
    </div>
  )
}
