import * as React from "react"
import { CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'CHECKED_IN' | 'NOT_CHECKED_IN' | 'PAID' | 'UNPAID' | 'FREE'
  className?: string
  showIcon?: boolean
}

const statusConfig = {
  SCHEDULED: {
    label: 'Scheduled',
    icon: Clock,
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    ariaLabel: 'Status: Scheduled',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    icon: AlertCircle,
    className: 'bg-green-100 text-green-800 border-green-200',
    ariaLabel: 'Status: In Progress',
  },
  COMPLETED: {
    label: 'Completed',
    icon: CheckCircle,
    className: 'bg-gray-100 text-gray-800 border-gray-200',
    ariaLabel: 'Status: Completed',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 border-red-200',
    ariaLabel: 'Status: Cancelled',
  },
  CHECKED_IN: {
    label: 'Checked In',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 border-green-200',
    ariaLabel: 'Status: Checked In',
  },
  NOT_CHECKED_IN: {
    label: 'Not Checked In',
    icon: Clock,
    className: 'bg-gray-100 text-gray-600 border-gray-200',
    ariaLabel: 'Status: Not Checked In',
  },
  PAID: {
    label: 'Paid',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 border-green-200',
    ariaLabel: 'Payment Status: Paid',
  },
  UNPAID: {
    label: 'Unpaid',
    icon: AlertCircle,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    ariaLabel: 'Payment Status: Unpaid',
  },
  FREE: {
    label: 'Free',
    icon: CheckCircle,
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    ariaLabel: 'Payment Status: Free Event',
  },
}

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        config.className,
        className
      )}
      aria-label={config.ariaLabel}
      role="status"
    >
      {showIcon && <Icon className="h-3 w-3" aria-hidden="true" />}
      <span>{config.label}</span>
    </span>
  )
}
