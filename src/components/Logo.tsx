import logo from '../assets/BQ_logo.svg'

type LogoProps = {
  small?: boolean
}

export function Logo({ small = false }: LogoProps) {
  return (
    <img
      src={logo}
      alt="Bi-quicker"
      className={small ? 'biquicker-logo biquicker-logo--small' : 'biquicker-logo'}
      draggable={false}
    />
  )
}
