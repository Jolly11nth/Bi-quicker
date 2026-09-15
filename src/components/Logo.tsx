import logo from '../assets/bi-quicker-logo.png'
import './logo-fix.css'

export function Logo({ small = false }: { small?: boolean }) {
  return (
    <img
      className={`biquicker-logo ${small ? 'logo-small' : ''}`}
      src={logo}
      alt="Bi-quicker"
      width={small ? 145 : 170}
      height={small ? 103 : 121}
      draggable={false}
    />
  )
}
