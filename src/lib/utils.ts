import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind class names, resolving conflicts (last wins). The standard
 * shadcn helper — added so drop-in shadcn-style components that expect
 * `@/lib/utils` work without further glue.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
