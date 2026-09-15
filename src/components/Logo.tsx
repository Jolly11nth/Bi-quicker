import logo from '../assets/bi-quicker-logo.png'

export function Logo({ small = false }: { small?: boolean }) {
  return <img className={`logo-mark ${small ? 'logo-small' : ''}`} src={logo} alt="Bi-quicker" />
}
