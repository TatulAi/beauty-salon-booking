import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-accent text-signature-ink hover:bg-accent-hover',
  secondary: 'bg-surface text-text border border-border hover:border-accent',
  danger: 'bg-transparent text-danger border border-danger hover:bg-danger/10',
}

export function Button({ variant = 'primary', className = '', disabled, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={`rounded-md px-4 py-2 text-sm font-medium tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  )
}
