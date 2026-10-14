import { useCallback, useEffect, useRef, useState } from 'react'

import { fetchCover } from '../services/coversApi.js'
import { duplicateKey } from '../utils/validate.js'

/**
 * Fetch covers for books that do not have one yet, one lookup at a time.
 *
 * Never blocks the UI and never surfaces an error: a miss simply becomes
 * coverStatus "missing" and the placeholder tile is shown. Nothing is
 * requested while the setting is off or the browser is offline; lookups
 * resume on the window "online" event.
 *
 * @param {import('../state/booksReducer.js').Book[]} books
 * @param {(action: {type: string, payload?: any}) => void} dispatch
 * @param {{ enabled?: boolean }} [options]
 * @returns {{ fetching: boolean, retry: (id: string) => void }}
 */
export function useCovers(books, dispatch, { enabled = true } = {}) {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine !== false,
  )
  const [fetching, setFetching] = useState(false)

  const booksRef = useRef(books)
  booksRef.current = books

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
      return undefined
    }
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  // Identity of the work to do: id + title/author so an edit starts a fresh lookup.
  const pendingKey = books
    .filter((book) => book.coverStatus === 'none')
    .map((book) => `${book.id}|${duplicateKey(book.title, book.author)}`)
    .join('~')

  useEffect(() => {
    if (!enabled || !online) return undefined

    const targets = booksRef.current.filter((book) => book.coverStatus === 'none')
    if (targets.length === 0) return undefined

    let cancelled = false
    const controllers = new Map()
    setFetching(true)

    const run = async () => {
      for (const book of targets) {
        if (cancelled) break
        const controller = new AbortController()
        controllers.set(book.id, controller)
        const match = duplicateKey(book.title, book.author)

        const { coverUrl } = await fetchCover({
          title: book.title,
          author: book.author,
          signal: controller.signal,
        })
        controllers.delete(book.id)
        if (cancelled) break

        dispatch({
          type: 'SET_COVER',
          payload: {
            id: book.id,
            coverUrl,
            coverStatus: coverUrl ? 'found' : 'missing',
            match,
          },
        })
      }
      if (!cancelled) setFetching(false)
    }

    run()

    return () => {
      cancelled = true
      controllers.forEach((controller) => controller.abort())
      controllers.clear()
    }
  }, [dispatch, enabled, online, pendingKey])

  const retry = useCallback(
    (id) => {
      if (!id) return
      dispatch({ type: 'SET_COVER', payload: { id, coverUrl: null, coverStatus: 'none' } })
    },
    [dispatch],
  )

  return { fetching, retry }
}

export default useCovers
