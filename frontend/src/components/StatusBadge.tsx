/**
 * Status is always icon + text label + colour, never colour alone (BRIEF §3).
 */

import { DEVICE_STATUS_LABELS, type DeviceStatus } from '../data'
import { StatusIcon } from './icons'

const STATUS_TEXT_CLASS: Record<DeviceStatus, string> = {
  good: 'text-status-good',
  warning: 'text-status-warning',
  serious: 'text-status-serious',
  critical: 'text-status-critical',
  offline: 'text-status-offline',
}

export default function StatusBadge({ status, className = '' }: { status: DeviceStatus; className?: string }) {
  const colour = STATUS_TEXT_CLASS[status]
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${colour} ${className}`}>
      <StatusIcon status={status} className="h-3.5 w-3.5 shrink-0" />
      <span>{DEVICE_STATUS_LABELS[status]}</span>
    </span>
  )
}
