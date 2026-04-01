/**
 * Button — componente reutilizable
 *
 * Props:
 *   variant: 'primary' | 'ghost'   (default: 'primary')
 *   size:    'sm' | 'md' | 'lg'    (default: 'md')
 *   loading: boolean               (muestra spinner y deshabilita)
 *   className: string              (clases adicionales)
 *   ...rest: atributos de <button>
 */

const variants = {
  primary:
    'bg-accent hover:bg-accent-hover text-accent-light font-bold shadow-lg shadow-accent/20',
  ghost:
    'bg-transparent border border-border-dark text-accent-light hover:border-accent hover:text-accent',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-md',
  md: 'px-4 py-3 text-base rounded-lg',
  lg: 'px-6 py-4 text-lg rounded-xl',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  ...rest
}) {
  return (
    <button
      disabled={loading || rest.disabled}
      className={`
        w-full inline-flex items-center justify-center
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...rest}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
          Cargando…
        </span>
      ) : (
        children
      )}
    </button>
  )
}
