import { useCallback, useEffect, useRef, useState } from 'react'

import { MSG } from '../utils/constants.js'
import {
  isAvailable,
  loadBooksWithNotice,
  onExternalChange,
  saveBooks,
} from '../services/storage.js'

/**
 * Keep the shelf in sync with localStorage.
 *
 * The shelf is read once, lazily, during the first render. It is written back
 * on every change (never before the first hydrate, so an empty initial state
 * cannot clobber stored data) and replaced when another tab changes the key.
 *
 * @param {import('../state/booksReducer.js').Book[]} books current shelf
 * @param {(books: import('../state/booksReducer.js').Book[]) => void} onHydrate
 * @returns {{ hydrated: boolean, saveError: boolean, notice: string, save: () => boolean }}
 */
export function usePersistedBooks(books, onHydrate) {
  const reportRef = useRef(null)
  if (reportRef.current === null) {
    reportRef.current = isAvailable()
      ? loadBooksWithNotice()
      : { books: [], notice: MSG.storageUnavailable }
  }

  const { books: initialBooks, notice } = reportRef.current
  const hydratedRef = useRef(false)
  const lastSyncedRef = useRef(null)
  const [saveError, setSaveError] = useState(false)

  // Hand the stored shelf to the provider exactly once, before the first save.
  useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true
    lastSyncedRef.current = JSON.stringify(initialBooks)
    onHydrate(initialBooks)
  }, [initialBooks, onHydrate])

  // Write back on every change; identical serialisations are skipped so an
  // external change cannot bounce back and forth between tabs.
  useEffect(() => {
    if (!hydratedRef.current) return
    if (!isAvailable()) return

    const serialized = JSON.stringify(books)
    if (serialized === lastSyncedRef.current) return

    if (saveBooks(books)) {
      lastSyncedRef.current = serialized
      setSaveError(false)
    } else {
      setSaveError(true)
    }
  }, [books])

  // Another tab changed the shelf: adopt it without echoing a write back.
  useEffect(() => {
    if (!isAvailable()) return undefined
    return onExternalChange((externalBooks) => {
      const serialized = JSON.stringify(externalBooks)
      if (serialized === lastSyncedRef.current) return
      lastSyncedRef.current = serialized
      onHydrate(externalBooks)
    })
  }, [onHydrate])

  const save = useCallback(() => {
    if (!isAvailable()) return false
    const ok = saveBooks(books)
    setSaveError(!ok)
    if (ok) lastSyncedRef.current = JSON.stringify(books)
    return ok
  }, [books])

  return { hydrated: hydratedRef.current, saveError, notice, save }
}

export default usePersistedBooks
