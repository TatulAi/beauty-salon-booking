import type { HTMLAttributes } from 'react'

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-md border border-border bg-surface p-4 transition-colors ${className}`}
      {...props}
    />
  )
}
