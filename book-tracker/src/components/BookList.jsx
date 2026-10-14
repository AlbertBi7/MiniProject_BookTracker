import BookCard from './BookCard.jsx'
import { MSG, STATUS_LABELS } from '../utils/constants.js'

/**
 * The shelf itself. Renders the empty state, the "no match" state or the
 * list of BookCards. Book.id is always the React key.
 *
 * @param {Object} props
 * @param {import('../state/booksReducer.js').Book[]} [props.books]  visibleBooks
 * @param {boolean} [props.hasAnyBooks]  true when the shelf is non-empty
 * @param {string} [props.query]  current search text, used by MSG.noMatch
 * @param {string} [props.statusFilter]  current chip, used by MSG.noStatusMatch
 * @param {string} [props.highlight]  term passed to Highlight for title/author marks
 * @param {(action: {type: string, payload?: any}) => void} [props.dispatch]
 * @param {(id: string, patch: object) => void} [props.onUpdate]
 * @param {(id: string) => void} [props.onDelete]
 * @param {(id: string) => void} [props.onFindCover]
 * @param {(title: string, author: string, ignoreId?: string) => boolean} [props.isDuplicate]
 * @param {React.RefObject<HTMLUListElement>} [props.listRef]
 */
export default function BookList({
  books = [],
  hasAnyBooks = false,
  query = '',
  statusFilter = 'all',
  highlight = '',
  dispatch,
  onUpdate,
  onDelete,
  onFindCover,
  isDuplicate,
  listRef,
}) {
  if (!hasAnyBooks) {
    return (
      <p className="empty-state" role="status">
        {MSG.emptyShelf}
      </p>
    )
  }

  if (books.length === 0) {
    const trimmedQuery = query.trim()
    const message = trimmedQuery
      ? MSG.noMatch(trimmedQuery)
      : MSG.noStatusMatch(STATUS_LABELS[statusFilter] ?? statusFilter)
    return (
      <p className="empty-state" role="status">
        {message}
      </p>
    )
  }

  return (
    <ul className="book-list" ref={listRef} aria-live="polite" aria-label="Your books">
      {books.map((book) => (
        <li key={book.id} className="book-list__item">
          <BookCard
            book={book}
            highlight={highlight || query}
            dispatch={dispatch}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onFindCover={onFindCover}
            isDuplicate={isDuplicate}
          />
        </li>
      ))}
    </ul>
  )
}
