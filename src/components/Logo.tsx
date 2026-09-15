import logo from '../assets/bi-quicker-logo.png'
import './logo-fix.css'

export function Logo({ small = false }: { small?: boolean }) {
  return (
    <img
      className={`logo-mark ${small ? 'logo-small' : ''}`}
      src={logo}
      alt="Bi-quicker"
      draggable={false}
      style={{ width: small ? 145 : 170, height: 'auto', objectFit: 'contain' }}
    />
  )
}
