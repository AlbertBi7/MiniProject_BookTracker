import { MSG } from '../utils/constants.js'
import { sanitizeBooks } from '../utils/validate.js'

export const BACKUP_APP = 'book-tracker'
export const BACKUP_VERSION = 1

const pad = (value) => String(value).padStart(2, '0')

/**
 * `book-tracker-backup-YYYY-MM-DD.json`
 *
 * @param {Date} [date]
 * @returns {string}
 */
export function backupFileName(date = new Date()) {
  return `book-tracker-backup-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}.json`
}

/**
 * Serialise the shelf as a JSON backup string.
 *
 * @param {import('../state/booksReducer.js').Book[]} books
 * @returns {string}
 */
export function exportJSON(books = []) {
  return JSON.stringify(
    {
      app: BACKUP_APP,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      books: Array.isArray(books) ? books : [],
    },
    null,
    2,
  )
}

/**
 * Trigger a browser download for a text file. Does nothing outside a browser.
 *
 * @param {string} filename
 * @param {string} text
 */
export function downloadTextFile(filename, text) {
  if (typeof document === 'undefined' || typeof URL?.createObjectURL !== 'function') return
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Parse + validate a backup file.
 *
 * @param {string} text raw file contents
 * @returns {{ ok: true, books: import('../state/booksReducer.js').Book[] } | { ok: false, error: string }}
 */
export function importJSON(text) {
  if (typeof text !== 'string' || text.trim() === '') {
    return { ok: false, error: MSG.importError }
  }

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: MSG.importError }
  }

  const list = Array.isArray(parsed)
    ? parsed
    : parsed && Array.isArray(parsed.books)
      ? parsed.books
      : null
  if (!list) return { ok: false, error: MSG.importError }

  const books = sanitizeBooks(list)
  if (books.length === 0) return { ok: false, error: MSG.importError }

  return { ok: true, books }
}
