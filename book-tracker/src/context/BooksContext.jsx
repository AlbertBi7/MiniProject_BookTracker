import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'

import { useCovers } from '../hooks/useCovers.js'
import { usePersistedBooks } from '../hooks/usePersistedBooks.js'
import { createInitialState, booksReducer } from '../state/booksReducer.js'
import { selectCounts, selectVisibleBooks } from '../state/selectors.js'
import { loadSettings, saveSettings } from '../services/storage.js'
import { MSG, UNDO_MS } from '../utils/constants.js'

/** @typedef {import('../state/booksReducer.js').Book} Book */
/** @typedef {import('../state/booksReducer.js').Filters} Filters */

/**
 * @typedef {Object} BooksContextValue
 * @property {Book[]} books                 Full shelf.
 * @property {Filters} filters              Active status/query/sort.
 * @property {Book[]} visibleBooks          Filtered + sorted shelf.
 * @property {{total:number,toRead:number,reading:number,finished:number,percentFinished:number}} counts
 * @property {(action: {type: string, payload?: any}) => void} dispatch
 * @property {(patch: Partial<Filters>) => void} setFilter
 * @property {{message?: string, undoLabel?: string, onUndo?: () => void} | null} toast
 * @property {(toast: {message?: string, undoLabel?: string, onUndo?: () => void} | null) => void} showToast
 * @property {{fetchCovers: boolean}} settings
 * @property {(patch: {fetchCovers?: boolean}) => void} setSettings
 */

const BooksContext = createContext(null)

/**
 * Owns all app state: the reducer, persistence, cover fetching and the toast.
 *
 * @param {{ children: React.ReactNode }} props
 */
export function BooksProvider({ children }) {
  const settingsRef = useRef(null)
  if (settingsRef.current === null) settingsRef.current = loadSettings()

  const [state, dispatch] = useReducer(booksReducer, settingsRef.current, (settings) =>
    createInitialState([], settings),
  )

  const [toast, setToast] = useState(null)
  const timeoutRef = useRef(null)

  const hydrate = useCallback((books) => dispatch({ type: 'HYDRATE', payload: { books } }), [])
  const persistence = usePersistedBooks(state.books, hydrate)

  useCovers(state.books, dispatch, { enabled: state.settings.fetchCovers })

  // Persist the settings the UI can change.
  useEffect(() => {
    saveSettings(state.settings)
  }, [state.settings])

  const showToast = useCallback((next) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (!next) {
      setToast(null)
      return
    }
    setToast({ message: '', undoLabel: MSG.undo, onUndo: undefined, ...next })
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null
      setToast(null)
    }, UNDO_MS)
  }, [])

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    },
    [],
  )

  // Storage problems are reported once, without blocking anything.
  useEffect(() => {
    if (persistence.notice) showToast({ message: persistence.notice })
  }, [persistence.notice, showToast])

  useEffect(() => {
    if (persistence.saveError) showToast({ message: MSG.saveError })
  }, [persistence.saveError, showToast])

  const setFilter = useCallback(
    (patch) => dispatch({ type: 'SET_FILTER', payload: patch ?? {} }),
    [],
  )

  const setSettings = useCallback(
    (patch) => dispatch({ type: 'SET_SETTINGS', payload: patch ?? {} }),
    [],
  )

  const visibleBooks = useMemo(
    () => selectVisibleBooks(state.books, state.filters),
    [state.books, state.filters],
  )

  const counts = useMemo(() => selectCounts(state.books), [state.books])

  const value = useMemo(
    () => ({
      books: state.books,
      filters: state.filters,
      visibleBooks,
      counts,
      dispatch,
      setFilter,
      toast,
      showToast,
      settings: state.settings,
      setSettings,
    }),
    [
      counts,
      dispatch,
      setFilter,
      setSettings,
      showToast,
      state.books,
      state.filters,
      state.settings,
      toast,
      visibleBooks,
    ],
  )

  return <BooksContext.Provider value={value}>{children}</BooksContext.Provider>
}

/**
 * Read the book shelf state. Throws when used outside <BooksProvider>.
 *
 * @returns {BooksContextValue}
 */
export function useBooks() {
  const context = useContext(BooksContext)
  if (!context) {
    throw new Error('useBooks() must be used inside <BooksProvider>')
  }
  return context
}

export default BooksContext
