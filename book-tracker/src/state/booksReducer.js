import {
  DEFAULT_SETTINGS,
  DEFAULT_SORT,
  MAX_AUTHOR,
  MAX_TITLE,
  STATUS,
  STATUS_LIST,
  SORTS,
} from '../utils/constants.js'
import { generateId } from '../utils/id.js'
import { duplicateKey, sanitizeBook, sanitizeBooks } from '../utils/validate.js'

/**
 * @typedef {Object} Book
 * @property {string} id                  Unique id (see utils/id.js).
 * @property {string} title               Book title, 1..MAX_TITLE chars.
 * @property {string} author              Author name, 1..MAX_AUTHOR chars.
 * @property {"to-read"|"reading"|"finished"} status
 * @property {number} rating              0..5 (0 = unrated).
 * @property {string} note                Free-form note, "" when empty.
 * @property {number} createdAt           Creation time in ms since epoch.
 * @property {number|null} finishedAt     ms since epoch when moved to finished, else null.
 * @property {string|null} coverUrl       Remote cover URL, null when unknown.
 * @property {"none"|"found"|"missing"} coverStatus
 */

/**
 * @typedef {Object} Filters
 * @property {"all"|"to-read"|"reading"|"finished"} status
 * @property {string} query
 * @property {"newest"|"oldest"|"title-az"|"author-az"} sort
 */

/** @type {{ books: Book[], filters: Filters, settings: typeof DEFAULT_SETTINGS }} */
export const initialState = {
  books: [],
  filters: {
    status: 'all',
    query: '',
    sort: DEFAULT_SORT,
  },
  settings: { ...DEFAULT_SETTINGS },
}

/**
 * Build the starting state, sanitising anything that came from storage.
 *
 * @param {Book[]} [books]
 * @param {Partial<typeof DEFAULT_SETTINGS>} [settings]
 * @returns {typeof initialState}
 */
export function createInitialState(books = [], settings = {}) {
  const safeSettings = settings && typeof settings === 'object' ? settings : {}
  return {
    books: sanitizeBooks(books),
    filters: { ...initialState.filters },
    settings: { ...DEFAULT_SETTINGS, ...safeSettings, fetchCovers: safeSettings.fetchCovers !== false },
  }
}

const withBook = (state, id, update) => {
  let changed = false
  const books = state.books.map((book) => {
    if (book.id !== id) return book
    const next = update(book)
    if (!next) return book
    changed = true
    return next
  })
  return changed ? { ...state, books } : state
}

/**
 * The single reducer that owns every mutation of the app.
 * Pure: (state, action) => nextState.
 *
 * Action shapes:
 *   { type: 'HYDRATE',     payload: { books } }              replace the shelf (storage / another tab)
 *   { type: 'ADD',         payload: { title, author, status, allowDuplicate } }
 *   { type: 'UPDATE',      payload: { id, patch } }
 *   { type: 'SET_STATUS',  payload: { id, status } }
 *   { type: 'DELETE',      payload: { id } }
 *   { type: 'RESTORE',     payload: { book, index } }
 *   { type: 'SET_COVER',   payload: { id, coverUrl, coverStatus, match } }
 *   { type: 'IMPORT',      payload: { books } }              merge by id, skipping ids already present
 *   { type: 'SET_FILTER',  payload: Partial<Filters> }
 *   { type: 'SET_SETTINGS',payload: Partial<typeof DEFAULT_SETTINGS> }
 *
 * @param {typeof initialState} state
 * @param {{ type: string, payload?: any }} action
 * @returns {typeof initialState}
 */
export function booksReducer(state = initialState, action) {
  switch (action?.type) {
    case 'HYDRATE':
      return { ...state, books: sanitizeBooks(action.payload?.books) }

    case 'ADD': {
      const { title, author, status, allowDuplicate } = action.payload ?? {}
      const cleanTitle = String(title ?? '').trim()
      const cleanAuthor = String(author ?? '').trim()
      // Nothing is saved when the required fields are missing.
      if (!cleanTitle || !cleanAuthor) return state

      const key = duplicateKey(cleanTitle, cleanAuthor)
      const isDuplicate = state.books.some(
        (book) => duplicateKey(book.title, book.author) === key,
      )
      // Duplicates only land when the caller confirmed with "Add anyway".
      if (isDuplicate && !allowDuplicate) return state

      const safeStatus = STATUS_LIST.includes(status) ? status : STATUS.TO_READ
      const now = Date.now()
      /** @type {Book} */
      const book = {
        id: generateId(),
        title: cleanTitle.slice(0, MAX_TITLE),
        author: cleanAuthor.slice(0, MAX_AUTHOR),
        status: safeStatus,
        rating: 0,
        note: '',
        createdAt: now,
        finishedAt: safeStatus === STATUS.FINISHED ? now : null,
        coverUrl: null,
        coverStatus: 'none',
      }
      return { ...state, books: [...state.books, book] }
    }

    case 'UPDATE': {
      const { id, patch } = action.payload ?? {}
      if (!id || !patch || typeof patch !== 'object') return state
      return withBook(state, id, (book) => {
        const cleaned = sanitizeBook({ ...book, ...patch, id: book.id })
        if (!cleaned) return null
        const identityChanged =
          cleaned.title !== book.title || cleaned.author !== book.author
        // A new title/author invalidates the old cover, so schedule a fresh lookup.
        if (
          identityChanged &&
          patch.coverStatus === undefined &&
          patch.coverUrl === undefined
        ) {
          cleaned.coverUrl = null
          cleaned.coverStatus = 'none'
        }
        return cleaned
      })
    }

    case 'SET_STATUS': {
      const { id, status } = action.payload ?? {}
      if (!STATUS_LIST.includes(status)) return state
      return withBook(state, id, (book) => ({
        ...book,
        status,
        finishedAt:
          status === STATUS.FINISHED
            ? book.status === STATUS.FINISHED && book.finishedAt
              ? book.finishedAt
              : Date.now()
            : null,
      }))
    }

    case 'DELETE': {
      const { id } = action.payload ?? {}
      if (!id) return state
      const books = state.books.filter((book) => book.id !== id)
      return books.length === state.books.length ? state : { ...state, books }
    }

    case 'RESTORE': {
      const { book, index } = action.payload ?? {}
      const cleaned = sanitizeBook(book)
      if (!cleaned) return state
      if (state.books.some((existing) => existing.id === cleaned.id)) return state
      const at = Number.isFinite(index)
        ? Math.min(Math.max(0, index), state.books.length)
        : state.books.length
      const books = [...state.books]
      books.splice(at, 0, cleaned)
      return { ...state, books }
    }

    case 'SET_COVER': {
      const { id, coverUrl, coverStatus, match } = action.payload ?? {}
      if (!id) return state
      return withBook(state, id, (book) => {
        // Ignore a lookup that resolved after the book was edited.
        if (match && duplicateKey(book.title, book.author) !== match) return null
        const url =
          typeof coverUrl === 'string' && coverUrl.startsWith('http') ? coverUrl : null
        return {
          ...book,
          coverUrl: url,
          coverStatus: url ? 'found' : coverStatus === 'none' ? 'none' : 'missing',
        }
      })
    }

    case 'IMPORT': {
      const incoming = sanitizeBooks(action.payload?.books)
      if (incoming.length === 0) return state
      const existing = new Set(state.books.map((book) => book.id))
      const merged = incoming.filter((book) => !existing.has(book.id))
      if (merged.length === 0) return state
      return { ...state, books: [...state.books, ...merged] }
    }

    case 'SET_FILTER': {
      const patch = action.payload ?? {}
      const next = { ...state.filters }
      if (typeof patch.query === 'string') next.query = patch.query
      if (patch.status === 'all' || STATUS_LIST.includes(patch.status)) next.status = patch.status
      if (SORTS.includes(patch.sort)) next.sort = patch.sort
      return { ...state, filters: next }
    }

    case 'SET_SETTINGS': {
      const patch = action.payload ?? {}
      const fetchCovers =
        patch.fetchCovers === undefined ? state.settings.fetchCovers : patch.fetchCovers !== false
      return { ...state, settings: { ...state.settings, ...patch, fetchCovers } }
    }

    default:
      return state
  }
}

export { STATUS }
