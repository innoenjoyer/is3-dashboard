import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

const CUSTOMER_NAME = 'Northgate Facilities'

function LiveFeedIndicator() {
  return (
    <span className="flex items-center gap-2 text-xs text-text-secondary">
      <span className="relative flex h-2 w-2" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-good opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-status-good" />
      </span>
      Live feed
    </span>
  )
}

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* First tab stop: jump straight past the header to the content.
          preventDefault: with HashRouter, a bare #main-content href would be
          parsed as a route and blank the page — focus the target instead. */}
      <a
        href="#main-content"
        onClick={(e) => {
          e.preventDefault()
          const main = document.getElementById('main-content')
          main?.focus()
          main?.scrollIntoView()
        }}
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[60] focus:rounded-md focus:border focus:border-border focus:bg-surface-2 focus:px-4 focus:py-2 focus:text-sm focus:text-text-primary"
      >
        Skip to content
      </a>
      <header className="border-b border-border bg-surface-1">
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <span className="font-display text-lg font-semibold tracking-wide">
              Is3
            </span>
            <nav aria-label="Main" className="flex items-center gap-4 text-sm">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'
                }
              >
                Fleet
              </NavLink>
              <NavLink
                to="/architecture"
                className={({ isActive }) =>
                  isActive ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'
                }
              >
                Architecture
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-text-secondary sm:inline">
              {CUSTOMER_NAME}
            </span>
            <LiveFeedIndicator />
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        {children}
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex h-10 max-w-7xl items-center justify-between px-4 text-xs text-text-muted">
          <span>Is3 — device fleet status</span>
          <span>Read-only · data refreshes automatically</span>
        </div>
      </footer>
    </div>
  )
}
