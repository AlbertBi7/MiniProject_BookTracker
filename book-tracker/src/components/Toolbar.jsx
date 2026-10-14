import { useCallback } from 'react'

import { SORTS, SORT_LABELS, STATUS_LABELS, STATUS_LIST } from '../utils/constants.js'

const FILTER_CHIPS = [
  { value: 'all', label: 'All' },
  ...STATUS_LIST.map((status) => ({ value: status, label: STATUS_LABELS[status] })),
]

/**
 * Search box, status filter chips and sort select.
 *
 * @param {Object} props
 * @param {React.RefObject<HTMLInputElement>} [props.searchRef]  targeted by the "/" shortcut
 * @param {string} [props.query]
 * @param {(query: string) => void} [props.onQueryChange]
 * @param {string} [props.status]  'all' | 'to-read' | 'reading' | 'finished'
 * @param {(status: string) => void} [props.onStatusChange]
 * @param {string} [props.sort]  one of SORTS
 * @param {(sort: string) => void} [props.onSortChange]
 */
export default function Toolbar({
  searchRef,
  query = '',
  onQueryChange,
  status = 'all',
  onStatusChange,
  sort = SORTS[0],
  onSortChange,
}) {
  const handleQueryChange = useCallback(
    (event) => {
      onQueryChange?.(event.target.value)
    },
    [onQueryChange],
  )

  const handleStatusClick = useCallback(
    (nextStatus) => {
      onStatusChange?.(nextStatus)
    },
    [onStatusChange],
  )

  const handleSortChange = useCallback(
    (event) => {
      onSortChange?.(event.target.value)
    },
    [onSortChange],
  )

  return (
    <section className="toolbar" aria-label="Search and filter your shelf">
      <div className="toolbar__search">
        <label htmlFor="book-search">Search</label>
        <input
          id="book-search"
          ref={searchRef}
          type="search"
          name="q"
          value={query}
          placeholder="Search title or author"
          autoComplete="off"
          onChange={handleQueryChange}
        />
      </div>

      <div className="toolbar__chips" role="group" aria-label="Filter by status">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.value}
            type="button"
            className="chip"
            aria-pressed={status === chip.value}
            onClick={() => handleStatusClick(chip.value)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="toolbar__sort">
        <label htmlFor="book-sort">Sort</label>
        <select id="book-sort" name="sort" value={sort} onChange={handleSortChange}>
          {SORTS.map((value) => (
            <option key={value} value={value}>
              {SORT_LABELS[value]}
            </option>
          ))}
        </select>
      </div>
    </section>
  )
}
