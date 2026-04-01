import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

export function LoginForm({ onNavigateToRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)
    if (authError) {
      setError(authError.message === 'Invalid login credentials'
        ? 'Correo o contraseña incorrectos.'
        : authError.message
      )
    }
    // Si el login es exitoso, App.jsx detecta el cambio de sesión y redirige automáticamente
  }

  return (
    <div className="w-full max-w-md bg-dark-card rounded-2xl shadow-2xl p-5 sm:p-8 border border-border-dark">

      {/* Logo / Title */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-accent tracking-tight">
          BackToZero
        </h1>
        <p className="mt-2 text-accent-light/60 text-sm">
          Tu camino hacia la libertad financiera
        </p>
      </div>

      {/* Error global */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      <form className="space-y-5" onSubmit={handleSubmit}>
        <Input
          id="email"
          label="Correo electrónico"
          type="email"
          placeholder="tucorreo@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          id="password"
          label="Contraseña"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="text-right">
          <a
            href="#"
            className="text-sm text-accent-light/50 hover:text-accent-light transition-colors duration-200"
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        <Button type="submit" loading={loading}>
          Iniciar Sesión
        </Button>
      </form>

      {/* Divider */}
      <div className="flex items-center my-6">
        <div className="flex-1 border-t border-border-dark/50" />
        <span className="px-3 text-accent-light/30 text-sm">o</span>
        <div className="flex-1 border-t border-border-dark/50" />
      </div>

      <p className="text-center text-accent-light/50 text-sm">
        ¿No tienes cuenta?{' '}
        <button
          type="button"
          onClick={onNavigateToRegister}
          className="text-accent font-semibold hover:text-accent-hover transition-colors duration-200"
        >
          Regístrate gratis
        </button>
      </p>
    </div>
  )
}
