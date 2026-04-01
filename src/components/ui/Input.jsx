/**
 * Input — campo de formulario reutilizable
 *
 * Props:
 *   label:       string  — texto del label
 *   id:          string  — vincula label con input
 *   error:       string  — mensaje de error (optional)
 *   className:   string  — clases adicionales al wrapper
 *   ...rest:     atributos de <input>
 */

export function Input({ label, id, error, className = '', ...rest }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-accent-light">
          {label}
        </label>
      )}

      <input
        id={id}
        className={`
          w-full bg-dark-bg border rounded-lg px-4 py-3
          text-accent-light placeholder-accent-light/30
          focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
          transition-all duration-200
          ${error ? 'border-danger' : 'border-border-dark'}
        `}
        {...rest}
      />

      {error && (
        <p className="text-danger text-xs mt-0.5">{error}</p>
      )}
    </div>
  )
}
