export function LegalDialog({ title, onClose }: { title: 'Terms of Service' | 'Privacy Policy'; onClose: () => void }) {
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <button className="dialog-close" onClick={onClose} aria-label="Close">×</button>
      <h2 id="dialog-title">{title}</h2>
      <p>{title === 'Terms of Service'
        ? 'By using Bi-quicker, you agree to use the marketplace responsibly and provide accurate account information.'
        : 'Bi-quicker uses your account information to provide marketplace, store, delivery, and platform administration services.'}</p>
      <button className="primary dialog-action" onClick={onClose}>Close</button>
    </div>
  </div>
}
