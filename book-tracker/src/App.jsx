import { useCallback, useEffect, useRef } from 'react'

import AddBookForm from './components/AddBookForm.jsx'
import BookList from './components/BookList.jsx'
import Header from './components/Header.jsx'
import SummaryStrip from './components/SummaryStrip.jsx'
import Toast from './components/Toast.jsx'
import Toolbar from './components/Toolbar.jsx'
import { useBooks } from './context/BooksContext.jsx'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js'
import { useTheme } from './hooks/useTheme.js'
import { backupFileName, downloadTextFile, exportJSON, importJSON } from './services/backup.js'
import { findDuplicate } from './utils/validate.js'
import { MSG } from './utils/constants.js'

/**
 * Top-level layout for Book Tracker.
 *
 * Reading order (mobile-first, single column):
 *   Header -> AddBookForm -> Toolbar -> SummaryStrip -> BookList -> Toast
 *
 * Owns the cross-cutting wiring the plan calls for: the shared refs, the
 * keyboard shortcuts, the backup file round-trip and delete-with-undo.
 */
export default function App() {
  const {
    books,
    filters,
    visibleBooks,
    counts,
    dispatch,
    setFilter,
    toast,
    showToast,
    settings,
    setSettings,
  } = useBooks()

  const { theme, toggleTheme } = useTheme()

  const titleRef = useRef(null)
  const searchRef = useRef(null)
  const listRef = useRef(null)
  const focusTimerRef = useRef(null)

  const closeToast = useCallback(() => showToast(null), [showToast])
  const clearSearch = useCallback(() => setFilter({ query: '' }), [setFilter])

  useKeyboardShortcuts(searchRef, clearSearch)

  useEffect(
    () => () => {
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current)
    },
    [],
  )

  const isDuplicate = useCallback(
    (title, author, ignoreId) => findDuplicate(books, title, author, ignoreId),
    [books],
  )

  const handleAdd = useCallback(
    ({ title, author, status, allowDuplicate }) => {
      dispatch({ type: 'ADD', payload: { title, author, status, allowDuplicate } })
    },
    [dispatch],
  )

  const handleUpdate = useCallback(
    (id, patch) => dispatch({ type: 'UPDATE', payload: { id, patch } }),
    [dispatch],
  )

  const handleDelete = useCallback(
    (id) => {
      const index = books.findIndex((book) => book.id === id)
      if (index === -1) return
      const book = books[index]
      const visibleIndex = visibleBooks.findIndex((item) => item.id === id)

      dispatch({ type: 'DELETE', payload: { id } })
      showToast({
        message: MSG.deleted,
        undoLabel: MSG.undo,
        onUndo: () => dispatch({ type: 'RESTORE', payload: { book, index } }),
      })

      // Focus the card that slid into this slot, or the search box when empty.
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current)
      focusTimerRef.current = setTimeout(() => {
        focusTimerRef.current = null
        const cards = listRef.current?.querySelectorAll('[data-book-id]') ?? []
        if (cards.length === 0) {
          searchRef.current?.focus()
          return
        }
        const target = cards[Math.min(Math.max(visibleIndex, 0), cards.length - 1)]
        target?.focus?.()
      }, 0)
    },
    [books, dispatch, showToast, visibleBooks],
  )

  const handleRetryCover = useCallback(
    (id) => dispatch({ type: 'SET_COVER', payload: { id, coverUrl: null, coverStatus: 'none' } }),
    [dispatch],
  )

  const handleExport = useCallback(() => {
    downloadTextFile(backupFileName(), exportJSON(books))
  }, [books])

  const handleImport = useCallback(
    (text) => {
      const result = importJSON(text)
      if (!result.ok) {
        showToast({ message: result.error || MSG.importError })
        return
      }
      const existing = new Set(books.map((book) => book.id))
      const added = result.books.filter((book) => !existing.has(book.id))
      if (added.length > 0) {
        dispatch({ type: 'IMPORT', payload: { books: added } })
        showToast({ message: MSG.imported(added.length) })
      } else {
        showToast({ message: MSG.importedNone })
      }
    },
    [books, dispatch, showToast],
  )

  const handleToggleFetchCovers = useCallback(
    (checked) => setSettings({ fetchCovers: Boolean(checked) }),
    [setSettings],
  )

  return (
    <div className="app">
      <div className="app__container">
        <Header
          theme={theme}
          onToggleTheme={toggleTheme}
          onExport={handleExport}
          onImport={handleImport}
          fetchCovers={settings.fetchCovers}
          onToggleFetchCovers={handleToggleFetchCovers}
        />
        <main className="app__main">
          <AddBookForm onAdd={handleAdd} titleRef={titleRef} isDuplicate={isDuplicate} />
          <Toolbar
            searchRef={searchRef}
            query={filters.query}
            onQueryChange={(query) => setFilter({ query })}
            status={filters.status}
            onStatusChange={(status) => setFilter({ status })}
            sort={filters.sort}
            onSortChange={(sort) => setFilter({ sort })}
          />
          <SummaryStrip counts={counts} />
          <BookList
            books={visibleBooks}
            hasAnyBooks={books.length > 0}
            query={filters.query}
            statusFilter={filters.status}
            highlight={filters.query}
            dispatch={dispatch}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onFindCover={handleRetryCover}
            isDuplicate={isDuplicate}
            listRef={listRef}
          />
        </main>
      </div>
      <Toast toast={toast} onClose={closeToast} />
    </div>
  )
}
