import logo from '../assets/bi-quicker-logo.png'

export function Logo({ small = false }: { small?: boolean }) {
  return (
    <img
      className={small ? 'biquicker-logo biquicker-logo--small' : 'biquicker-logo'}
      src={logo}
      alt="Bi-quicker"
      width={small ? 145 : 341}
      height={small ? 103 : 243}
      draggable={false}
    />
  )
}
