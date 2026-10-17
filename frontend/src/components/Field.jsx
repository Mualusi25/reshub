export default function Field({ label, id, error, icon: Icon, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>
        {Icon && <Icon size={15} />} {label}
      </label>
      {children}
      {error && <span className="error" role="alert">{error.message}</span>}
    </div>
  )
}