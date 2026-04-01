import { LoginForm } from './LoginForm'

export function LoginPage({ onNavigateToRegister }) {
  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
      <LoginForm onNavigateToRegister={onNavigateToRegister} />
    </div>
  )
}
