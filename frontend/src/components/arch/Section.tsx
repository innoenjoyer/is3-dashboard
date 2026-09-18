/**
 * Section — the page-block frame used across the architecture page: a
 * display-face heading, an optional intro line, then content. Same
 * typography roles as the dashboard (BRIEF §3).
 */

import type { ReactNode } from 'react'

interface SectionProps {
  id: string
  title: string
  intro?: ReactNode
  children: ReactNode
}

export default function Section({ id, title, intro, children }: SectionProps) {
  return (
    <section aria-labelledby={id} className="space-y-4">
      <div className="space-y-1.5">
        <h2 id={id} className="font-display text-lg font-semibold text-text-primary">
          {title}
        </h2>
        {intro && <div className="max-w-3xl text-sm text-text-secondary">{intro}</div>}
      </div>
      {children}
    </section>
  )
}
