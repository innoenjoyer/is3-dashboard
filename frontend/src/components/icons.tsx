/**
 * Inline SVG icons. Stroke-only, inherit currentColor so callers control
 * colour via Tailwind text-token classes — no hardcoded hex here.
 */

import type { DeviceKind, DeviceStatus } from '../data'

interface IconProps {
  className?: string
}

function Svg({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  )
}

export function KindIcon({ kind, className }: IconProps & { kind: DeviceKind }) {
  switch (kind) {
    case 'camera':
      return (
        <Svg className={className}>
          <rect x="2" y="6" width="14" height="12" rx="2" />
          <path d="M16 10.5 22 7.5v9l-6-3" />
        </Svg>
      )
    case 'switch':
      return (
        <Svg className={className}>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M12 7v5" />
          <circle cx="12" cy="15.5" r="1" />
        </Svg>
      )
    case 'fridge':
      return (
        <Svg className={className}>
          <rect x="6" y="2" width="12" height="20" rx="2" />
          <path d="M6 9h12" />
          <path d="M15 5v2M15 12v3" />
        </Svg>
      )
    case 'thermostat':
      return (
        <Svg className={className}>
          <path d="M10 4a2 2 0 0 1 4 0v8.5a4 4 0 1 1-4 0z" />
          <circle cx="12" cy="16.5" r="1.5" />
        </Svg>
      )
    case 'intercom':
      return (
        <Svg className={className}>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <circle cx="12" cy="9" r="2.5" />
          <path d="M9 15.5h6M9 18.5h6" />
        </Svg>
      )
  }
}

/** Status icons — always paired with a text label via StatusBadge. */
export function StatusIcon({ status, className }: IconProps & { status: DeviceStatus }) {
  switch (status) {
    case 'good':
      return (
        <Svg className={className}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12.5l2.5 2.5L16 9.5" />
        </Svg>
      )
    case 'warning':
      return (
        <Svg className={className}>
          <path d="M12 3.5 21 20H3z" />
          <path d="M12 10v4M12 17v.01" />
        </Svg>
      )
    case 'serious':
      return (
        <Svg className={className}>
          <path d="M12 2.5 21.5 12 12 21.5 2.5 12z" />
          <path d="M12 8.5V13M12 16v.01" />
        </Svg>
      )
    case 'critical':
      return (
        <Svg className={className}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9 9l6 6M15 9l-6 6" />
        </Svg>
      )
    case 'offline':
      return (
        <Svg className={className}>
          <circle cx="12" cy="12" r="9" />
          <path d="M5.5 5.5l13 13" />
        </Svg>
      )
  }
}
