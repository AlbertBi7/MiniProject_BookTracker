/**
 * Generate a unique id for a book.
 *
 * @returns {string}
 */
export function generateId() {
  const webCrypto = typeof crypto !== 'undefined' ? crypto : undefined
  if (webCrypto && typeof webCrypto.randomUUID === 'function') {
    try {
      return webCrypto.randomUUID()
    } catch {
      /* fall through to the manual fallback */
    }
  }
  return `bk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export default generateId
