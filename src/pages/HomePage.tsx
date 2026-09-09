import { Link } from 'react-router-dom'
import { useLanguage } from '@/i18n/LanguageContext'
import { Button } from '@/components/ui/Button'
import { Ticket, TicketDivider } from '@/components/ui/Ticket'

export function HomePage() {
  const { t } = useLanguage()

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-16 px-6 py-20 md:grid-cols-2 md:py-28">
      <div className="flex flex-col items-start gap-6">
        <h1 className="font-display text-4xl leading-[1.1] font-medium text-text md:text-5xl">
          {t.home.heading}
        </h1>
        <p className="max-w-md text-lg text-text-secondary">{t.home.subheading}</p>
        <Link to="/book">
          <Button>{t.home.cta}</Button>
        </Link>
      </div>

      {/* Illustrative preview of a confirmed booking — the app's signature
          ticket motif, shown here purely as a decorative example rather than
          real data, so a first-time visitor sees what they're about to get. */}
      <div className="flex justify-center md:justify-end">
        <Ticket className="ticket-idle w-64 max-w-full pt-8" aria-hidden="true">
          <p className="font-mono text-xs tracking-wide text-text-secondary">{t.home.ticketDay}</p>
          <p className="font-display mt-1 text-xl font-medium text-text">{t.home.ticketService}</p>
          <p className="mt-1 text-sm text-text-secondary">{t.home.ticketWith}</p>
          <TicketDivider />
          <p className="font-mono text-lg text-signature-text">{t.home.ticketPrice}</p>
        </Ticket>
      </div>
    </div>
  )
}
