import { DEFAULT_SORT, STATUS } from '../utils/constants.js'

const byText = (a, b) =>
  String(a ?? '').localeCompare(String(b ?? ''), undefined, { sensitivity: 'base' })

/**
 * Filter + search + sort the shelf for display.
 *
 * The pipeline is always: status filter, then search, then sort.
 *
 * @param {import('./booksReducer.js').Book[]} books
 * @param {import('./booksReducer.js').Filters} filters
 * @returns {import('./booksReducer.js').Book[]}
 */
export function selectVisibleBooks(books = [], filters = {}) {
  const status = filters?.status ?? 'all'
  const rawQuery = filters?.query ?? ''
  const sort = filters?.sort ?? DEFAULT_SORT

  let result = Array.isArray(books) ? books.slice() : []

  if (status !== 'all') {
    result = result.filter((book) => book.status === status)
  }

  const query = String(rawQuery).trim().toLowerCase()
  if (query) {
    result = result.filter((book) => {
      const title = String(book.title ?? '').toLowerCase()
      const author = String(book.author ?? '').toLowerCase()
      return title.includes(query) || author.includes(query)
    })
  }

  const newestFirst = (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)

  switch (sort) {
    case 'oldest':
      result.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
      break
    case 'title-az':
      result.sort((a, b) => byText(a.title, b.title) || newestFirst(a, b))
      break
    case 'author-az':
      result.sort(
        (a, b) => byText(a.author, b.author) || byText(a.title, b.title) || newestFirst(a, b),
      )
      break
    case 'newest':
    default:
      result.sort(newestFirst)
      break
  }

  return result
}

/**
 * Counts for the summary strip.
 *
 * @param {import('./booksReducer.js').Book[]} books
 * @returns {{ total: number, toRead: number, reading: number, finished: number, percentFinished: number }}
 */
export function selectCounts(books = []) {
  const list = Array.isArray(books) ? books : []
  let toRead = 0
  let reading = 0
  let finished = 0

  for (const book of list) {
    if (book.status === STATUS.FINISHED) finished += 1
    else if (book.status === STATUS.READING) reading += 1
    else toRead += 1
  }

  const total = list.length
  const percentFinished = total === 0 ? 0 : Math.round((finished / total) * 100)

  return { total, toRead, reading, finished, percentFinished }
}

/**
 * Human sentence for the summary strip, e.g. "3 finished, 1 reading, 2 to read".
 *
 * @param {{total:number,toRead:number,reading:number,finished:number}} counts
 * @returns {string}
 */
export function describeCounts(counts) {
  if (!counts || counts.total === 0) return ''
  const parts = []
  if (counts.finished > 0) parts.push(`${counts.finished} finished`)
  if (counts.reading > 0) parts.push(`${counts.reading} reading`)
  if (counts.toRead > 0) parts.push(`${counts.toRead} to read`)
  return parts.join(', ')
}

export { STATUS }
