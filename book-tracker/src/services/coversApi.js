import { COVER_TIMEOUT_MS } from '../utils/constants.js'

/**
 * Build the Open Library search URL for a title + author.
 *
 * @param {string} title
 * @param {string} author
 * @returns {string}
 */
export function buildSearchUrl(title, author) {
  const params = new URLSearchParams({
    title: String(title ?? ''),
    author: String(author ?? ''),
    limit: '1',
    fields: 'title,author_name,cover_i',
  })
  return `https://openlibrary.org/search.json?${params.toString()}`
}

/**
 * Turn a cover id into a direct cover image URL.
 *
 * @param {number|string} coverId
 * @param {'S'|'M'|'L'} [size]
 * @returns {string}
 */
export function buildCoverUrl(coverId, size = 'M') {
  return `https://covers.openlibrary.org/b/id/${encodeURIComponent(String(coverId))}-${size}.jpg`
}

/**
 * Look up one cover. Never throws and never rejects: on timeout, network error
 * or no usable result it resolves to { coverUrl: null }.
 *
 * Only the title and author are ever sent (see the README privacy note).
 *
 * @param {{ title: string, author: string, signal?: AbortSignal }} params
 * @returns {Promise<{ coverUrl: string|null }>}
 */
export async function fetchCover({ title, author, signal } = {}) {
  if (typeof fetch !== 'function' || typeof AbortController !== 'function') {
    return { coverUrl: null }
  }
  if (signal && signal.aborted) return { coverUrl: null }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), COVER_TIMEOUT_MS)
  const forwardAbort = () => controller.abort()
  if (signal && typeof signal.addEventListener === 'function') {
    signal.addEventListener('abort', forwardAbort)
  }

  try {
    const response = await fetch(buildSearchUrl(title, author), {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    if (!response || !response.ok) return { coverUrl: null }

    const data = await response.json()
    const docs = Array.isArray(data?.docs) ? data.docs : []
    const hit = docs.find((doc) => doc && (doc.cover_i || doc.cover_i === 0))
    if (!hit || !hit.cover_i) return { coverUrl: null }

    return { coverUrl: buildCoverUrl(hit.cover_i, 'M') }
  } catch {
    // Timeout, abort, offline or a malformed body: treat it as "no cover".
    return { coverUrl: null }
  } finally {
    clearTimeout(timer)
    if (signal && typeof signal.removeEventListener === 'function') {
      signal.removeEventListener('abort', forwardAbort)
    }
  }
}
