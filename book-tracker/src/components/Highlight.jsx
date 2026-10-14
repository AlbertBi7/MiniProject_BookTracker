import { Fragment } from 'react'

/**
 * Mark the parts of `text` that match `term`.
 * Splits into plain strings + <mark> nodes — never dangerouslySetInnerHTML,
 * and never a RegExp built from user input.
 *
 * @param {Object} props
 * @param {string} [props.text]
 * @param {string} [props.term]
 */
export default function Highlight({ text = '', term = '' }) {
  const source = String(text ?? '')
  const needle = String(term ?? '').trim()

  if (!source || !needle) return source

  const haystack = source.toLowerCase()
  const lowerNeedle = needle.toLowerCase()

  const parts = []
  let cursor = 0
  let found = haystack.indexOf(lowerNeedle, cursor)

  while (found !== -1) {
    if (found > cursor) parts.push({ text: source.slice(cursor, found), match: false })
    parts.push({ text: source.slice(found, found + needle.length), match: true })
    cursor = found + needle.length
    found = haystack.indexOf(lowerNeedle, cursor)
  }

  if (parts.length === 0) return source
  if (cursor < source.length) parts.push({ text: source.slice(cursor), match: false })

  return (
    <>
      {parts.map((part, index) =>
        part.match ? (
          <mark key={index} className="highlight">
            {part.text}
          </mark>
        ) : (
          <Fragment key={index}>{part.text}</Fragment>
        ),
      )}
    </>
  )
}
