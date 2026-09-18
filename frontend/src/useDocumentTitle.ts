/**
 * useDocumentTitle — per-route <title>. The document keeps a sensible
 * default in index.html; each page narrows it while mounted.
 */

import { useEffect } from 'react'

const DEFAULT_TITLE = 'Is3 — device fleet status'

export default function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = `${title} — Is3`
    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [title])
}
