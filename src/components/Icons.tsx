import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>
const base = (props: IconProps) => ({
  viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, ...props,
})

export function CustomerIcon(props: IconProps) { return <svg {...base(props)}><path d="M6 8h12l1 12H5L6 8Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/></svg> }
export function StoreIcon(props: IconProps) { return <svg {...base(props)}><path d="M3 10h18l-1-5H4l-1 5Z"/><path d="M5 10v9h14v-9"/><path d="M9 19v-5h6v5"/><path d="M3 10c0 1.5 1.3 2.5 2.7 2.5S8.5 11.5 8.5 10c0 1.5 1.3 2.5 2.7 2.5s2.8-1 2.8-2.5c0 1.5 1.3 2.5 2.7 2.5S19.5 11.5 19.5 10"/></svg> }
export function RiderIcon(props: IconProps) { return <svg {...base(props)}><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l3-8h5l4 8M9 9l-2-3h4l2 3M11 17h4"/></svg> }
export function AdminIcon(props: IconProps) { return <svg {...base(props)}><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z"/></svg> }
export function MailIcon(props: IconProps) { return <svg {...base(props)}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg> }
export function LockIcon(props: IconProps) { return <svg {...base(props)}><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg> }
export function EyeIcon(props: IconProps) { return <svg {...base(props)}><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg> }
export function EyeOffIcon(props: IconProps) { return <svg {...base(props)}><path d="m3 3 18 18M10.6 6.2A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a17.4 17.4 0 0 1-3.1 3.7M6.2 6.2C3.4 8.2 2 12 2 12s3.5 6 10 6c1.5 0 2.8-.3 4-.8"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg> }
export function ArrowLeftIcon(props: IconProps) { return <svg {...base(props)}><path d="m15 18-6-6 6-6"/></svg> }
export function ArrowRightIcon(props: IconProps) { return <svg {...base(props)}><path d="m9 18 6-6-6-6"/></svg> }
