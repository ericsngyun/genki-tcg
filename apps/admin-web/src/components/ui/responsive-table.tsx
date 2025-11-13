import * as React from "react"
import { cn } from "@/lib/utils"

interface ResponsiveTableProps {
  children: React.ReactNode
  className?: string
  ariaLabel?: string
}

/**
 * ResponsiveTable component provides mobile-friendly table rendering
 * with horizontal scroll and visual scroll indicators
 */
export function ResponsiveTable({ children, className, ariaLabel }: ResponsiveTableProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div
        className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        role="region"
        aria-label={ariaLabel || "Data table"}
        tabIndex={0}
      >
        <div className="min-w-full inline-block align-middle">
          <div className={cn("overflow-hidden", className)}>
            {children}
          </div>
        </div>
      </div>

      {/* Mobile scroll indicator */}
      <div className="md:hidden bg-gray-50 px-4 py-2 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center" role="status" aria-live="polite">
          Swipe left or right to view more columns
        </p>
      </div>
    </div>
  )
}

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  ariaLabel?: string
}

export function Table({ className, ariaLabel, ...props }: TableProps) {
  return (
    <table
      className={cn("min-w-full divide-y divide-gray-200", className)}
      aria-label={ariaLabel}
      {...props}
    />
  )
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cn("bg-gray-50", className)} {...props} />
  )
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn("bg-white divide-y divide-gray-200", className)} {...props} />
  )
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn("hover:bg-gray-50 transition-colors", className)} {...props} />
  )
}

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean
}

export function TableHead({ className, sortable = false, children, ...props }: TableHeadProps) {
  return (
    <th
      scope="col"
      className={cn(
        "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
        sortable && "cursor-pointer hover:bg-gray-100",
        className
      )}
      {...props}
    >
      {children}
    </th>
  )
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("px-6 py-4 whitespace-nowrap text-sm", className)}
      {...props}
    />
  )
}

/**
 * Mobile-friendly card view for table data
 * Use this as an alternative to tables on small screens
 */
interface MobileCardProps {
  children: React.ReactNode
  className?: string
}

export function MobileCard({ children, className }: MobileCardProps) {
  return (
    <div
      className={cn(
        "md:hidden bg-white p-4 rounded-lg border border-gray-200 mb-3",
        className
      )}
    >
      {children}
    </div>
  )
}

interface MobileCardRowProps {
  label: string
  value: React.ReactNode
  className?: string
}

export function MobileCardRow({ label, value, className }: MobileCardRowProps) {
  return (
    <div className={cn("flex justify-between py-2 border-b border-gray-100 last:border-0", className)}>
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  )
}
