import { RegisterForm } from './RegisterForm'

export function RegisterPage({ onNavigateToLogin }) {
  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
      <RegisterForm onNavigateToLogin={onNavigateToLogin} />
    </div>
  )
}
