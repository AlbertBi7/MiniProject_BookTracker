import {
  MAX_AUTHOR,
  MAX_NOTE,
  MAX_RATING,
  MAX_TITLE,
  MSG,
  STATUS,
  STATUS_LIST,
} from './constants.js'

/**
 * Validate the user-entered fields of a book.
 *
 * @param {{ title?: string, author?: string }} input
 * @returns {{ valid: boolean, errors: { title?: string, author?: string } }}
 */
export function validateBook(input = {}) {
  const title = String(input?.title ?? '').trim()
  const author = String(input?.author ?? '').trim()

  /** @type {{ title?: string, author?: string }} */
  const errors = {}

  if (!title) errors.title = MSG.titleRequired
  else if (title.length > MAX_TITLE) errors.title = MSG.titleTooLong

  if (!author) errors.author = MSG.authorRequired
  else if (author.length > MAX_AUTHOR) errors.author = MSG.authorTooLong

  return { valid: Object.keys(errors).length === 0, errors }
}

/**
 * Normalise a title + author pair for duplicate comparison.
 *
 * @param {string} [title]
 * @param {string} [author]
 * @returns {string}
 */
export function duplicateKey(title = '', author = '') {
  const clean = (value) => String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
  return `${clean(title)}\u0000${clean(author)}`
}

/**
 * Does the shelf already contain this title + author (case-insensitive)?
 *
 * @param {import('../state/booksReducer.js').Book[]} books
 * @param {string} title
 * @param {string} author
 * @param {string} [ignoreId] book id to skip (used while editing)
 * @returns {boolean}
 */
export function findDuplicate(books = [], title = '', author = '', ignoreId = '') {
  const key = duplicateKey(title, author)
  return books.some((book) => book.id !== ignoreId && duplicateKey(book.title, book.author) === key)
}

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0

const clampRating = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.min(MAX_RATING, Math.max(0, Math.round(numeric)))
}

const safeTimestamp = (value, fallback) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback
}

const isHttpUrl = (value) =>
  typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))

/**
 * Turn untrusted data (localStorage, an imported backup file) into a Book,
 * or return null when the entry cannot be salvaged.
 *
 * @param {any} raw
 * @returns {import('../state/booksReducer.js').Book | null}
 */
export function sanitizeBook(raw) {
  if (!raw || typeof raw !== 'object') return null

  const id = typeof raw.id === 'string' ? raw.id.trim() : ''
  const title = typeof raw.title === 'string' ? raw.title.trim() : ''
  const author = typeof raw.author === 'string' ? raw.author.trim() : ''
  if (!isNonEmptyString(id) || !isNonEmptyString(title) || !isNonEmptyString(author)) return null

  const status = STATUS_LIST.includes(raw.status) ? raw.status : STATUS.TO_READ
  const createdAt = safeTimestamp(raw.createdAt, Date.now())
  const coverUrl = isHttpUrl(raw.coverUrl) ? raw.coverUrl : null
  const finishedAt =
    status === STATUS.FINISHED ? safeTimestamp(raw.finishedAt, createdAt) : null

  let coverStatus = 'none'
  if (coverUrl) coverStatus = 'found'
  else if (raw.coverStatus === 'missing') coverStatus = 'missing'

  return {
    id,
    title: title.slice(0, MAX_TITLE),
    author: author.slice(0, MAX_AUTHOR),
    status,
    rating: clampRating(raw.rating),
    note: typeof raw.note === 'string' ? raw.note.slice(0, MAX_NOTE) : '',
    createdAt,
    finishedAt,
    coverUrl,
    coverStatus,
  }
}

/**
 * Sanitise a list of books, dropping every entry that cannot be salvaged.
 *
 * @param {any} list
 * @returns {import('../state/booksReducer.js').Book[]}
 */
export function sanitizeBooks(list) {
  if (!Array.isArray(list)) return []
  const books = []
  for (const entry of list) {
    const book = sanitizeBook(entry)
    if (book) books.push(book)
  }
  return books
}

// Kept from the skeleton so the module's public surface is unchanged.
export { MSG }
