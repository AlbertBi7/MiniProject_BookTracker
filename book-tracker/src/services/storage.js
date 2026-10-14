import {
  DEFAULT_SETTINGS,
  DEFAULT_THEME,
  SETTINGS_KEY,
  STORAGE_KEY,
  THEME_KEY,
  THEMES,
  MSG,
} from '../utils/constants.js'
import { sanitizeBooks } from '../utils/validate.js'

/** localStorage access can throw (private mode, disabled storage). */
const getStore = () => {
  try {
    const store = window.localStorage
    return store || null
  } catch {
    return null
  }
}

/**
 * Is localStorage usable (private mode / disabled storage returns false)?
 * @returns {boolean}
 */
export function isAvailable() {
  const store = getStore()
  if (!store) return false
  try {
    const probe = '__bookTrackerProbe__'
    store.setItem(probe, '1')
    store.removeItem(probe)
    return true
  } catch {
    return false
  }
}

/**
 * Parse a raw stored value into a clean shelf.
 *
 * @param {string|null|undefined} raw
 * @returns {{ books: import('../state/booksReducer.js').Book[], corrupt: boolean }}
 */
function parseStoredBooks(raw) {
  if (raw === null || raw === undefined || raw === '') {
    return { books: [], corrupt: false }
  }
  try {
    const parsed = JSON.parse(raw)
    const list = Array.isArray(parsed)
      ? parsed
      : parsed && Array.isArray(parsed.books)
        ? parsed.books
        : null
    if (!list) return { books: [], corrupt: true }
    return { books: sanitizeBooks(list), corrupt: false }
  } catch {
    return { books: [], corrupt: true }
  }
}

/**
 * Read the shelf plus any notice the UI should show.
 *
 * @returns {{ books: import('../state/booksReducer.js').Book[], notice: string }}
 */
export function loadBooksWithNotice() {
  const store = getStore()
  if (!store) return { books: [], notice: MSG.storageUnavailable }

  let raw = null
  try {
    raw = store.getItem(STORAGE_KEY)
  } catch {
    return { books: [], notice: MSG.loadError }
  }

  const { books, corrupt } = parseStoredBooks(raw)
  return { books, notice: corrupt ? MSG.loadError : '' }
}

/**
 * Read the shelf from localStorage.
 * @returns {import('../state/booksReducer.js').Book[]} [] on any failure.
 */
export function loadBooks() {
  return loadBooksWithNotice().books
}

/**
 * Persist the shelf.
 * @param {import('../state/booksReducer.js').Book[]} books
 * @returns {boolean} true when the write succeeded.
 */
export function saveBooks(books) {
  const store = getStore()
  if (!store) return false
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(Array.isArray(books) ? books : []))
    return true
  } catch {
    return false
  }
}

/** @returns {'system'|'light'|'dark'} */
export function loadTheme() {
  const store = getStore()
  if (!store) return DEFAULT_THEME
  try {
    const value = store.getItem(THEME_KEY)
    return THEMES.includes(value) ? value : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

/** @param {'system'|'light'|'dark'} theme */
export function saveTheme(theme) {
  const store = getStore()
  if (!store) return false
  try {
    store.setItem(THEME_KEY, THEMES.includes(theme) ? theme : DEFAULT_THEME)
    return true
  } catch {
    return false
  }
}

/** @returns {typeof DEFAULT_SETTINGS} */
export function loadSettings() {
  const store = getStore()
  if (!store) return { ...DEFAULT_SETTINGS }
  try {
    const parsed = JSON.parse(store.getItem(SETTINGS_KEY) ?? 'null')
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_SETTINGS }
    return { ...DEFAULT_SETTINGS, ...parsed, fetchCovers: parsed.fetchCovers !== false }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

/** @param {Partial<typeof DEFAULT_SETTINGS>} settings */
export function saveSettings(settings) {
  const store = getStore()
  if (!store) return false
  try {
    store.setItem(SETTINGS_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, ...settings }))
    return true
  } catch {
    return false
  }
}

/**
 * Subscribe to storage events so a second tab keeps the shelf in sync.
 *
 * @param {(books: import('../state/booksReducer.js').Book[]) => void} [onBooks]
 * @param {(theme: string) => void} [onTheme]
 * @returns {() => void} unsubscribe
 */
export function onExternalChange(onBooks, onTheme) {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
    return () => {}
  }

  const handler = (event) => {
    if (!event || typeof event.key !== 'string') return
    const store = getStore()
    if (event.storageArea && store && event.storageArea !== store) return

    if (event.key === STORAGE_KEY && typeof onBooks === 'function') {
      onBooks(parseStoredBooks(event.newValue).books)
      return
    }
    if (event.key === THEME_KEY && typeof onTheme === 'function') {
      onTheme(THEMES.includes(event.newValue) ? event.newValue : DEFAULT_THEME)
    }
  }

  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}
