import logo from '../assets/bi-quicker-logo.png'

export function Logo({ small = false }: { small?: boolean }) {
  const width = small ? 145 : 170
  const height = small ? 103 : 121

  return (
    <img
      className={small ? 'biquicker-logo biquicker-logo--small' : 'biquicker-logo'}
      src={logo}
      alt="Bi-quicker"
      width={width}
      height={height}
      draggable={false}
      style={{
        display: 'block',
        width: `${width}px`,
        height: `${height}px`,
        maxWidth: '100%',
        minWidth: 0,
        minHeight: 0,
        objectFit: 'contain',
        objectPosition: 'center',
        marginLeft: small ? 0 : 'auto',
        marginRight: small ? 0 : 'auto',
        marginBottom: small ? '18px' : '22px',
        border: 0,
        borderRadius: 0,
      }}
    />
  )
}
