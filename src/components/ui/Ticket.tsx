import type { HTMLAttributes } from 'react'

interface TicketProps extends HTMLAttributes<HTMLDivElement> {
  /** Fades the swatch tab to grey — used for a cancelled appointment. */
  muted?: boolean
}

/**
 * The one signature element of this app's design: a punch-ticket card with
 * a solid swatch tab clipped to the corner (the device a colourist uses to
 * show a hair-dye swatch) and a perforated tear-line (see TicketDivider)
 * separating the "what and when" from the "how much and what status" — the
 * way a real ticket stub separates the part you keep from the part torn off.
 */
export function Ticket({ muted, className = '', children, ...props }: TicketProps) {
  return (
    <div className={`ticket ${muted ? 'ticket--muted' : ''} px-4 pb-4 ${className}`} {...props}>
      <div className="ticket-tab" aria-hidden="true" />
      {children}
    </div>
  )
}

export function TicketDivider() {
  return <div className="ticket-tear" aria-hidden="true" />
}
