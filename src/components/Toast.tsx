import { useEffect } from 'react'

export function Toast({ message, type = 'success', onClose }: { message: string; type?: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 3600)
    return () => window.clearTimeout(timer)
  }, [onClose])

  return <div className={`toast ${type}`} role="status" aria-live="polite">
    <span>{message}</span>
    <button onClick={onClose} aria-label="Dismiss">×</button>
  </div>
}
