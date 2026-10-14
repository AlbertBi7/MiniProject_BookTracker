import { useEffect, useState } from 'react'

const hashHue = (value) => {
  const source = String(value ?? '')
  let hash = 0
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) % 360
  }
  return hash
}

/**
 * Fixed-size cover thumbnail. While loading, when missing, offline or on an
 * <img> error it falls back to a placeholder tile showing the first letter of
 * the title, tinted from a hash of that title. The error state is local only.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {string|null} [props.coverUrl]
 * @param {'none'|'found'|'missing'} [props.coverStatus]
 */
export default function BookCover({ title = '', coverUrl = null, coverStatus = 'none' }) {
  const [failed, setFailed] = useState(false)

  // A fresh URL deserves a fresh attempt.
  useEffect(() => {
    setFailed(false)
  }, [coverUrl])

  const showImage = Boolean(coverUrl) && coverStatus !== 'missing' && !failed

  if (showImage) {
    return (
      <img
        className="book-cover"
        src={coverUrl}
        alt={`Cover of ${title}`}
        width={56}
        height={84}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    )
  }

  const hue = hashHue(title)

  return (
    <div
      className="book-cover book-cover--placeholder"
      style={{
        backgroundColor: `hsl(${hue} 52% 86%)`,
        color: `hsl(${hue} 45% 26%)`,
      }}
      aria-hidden="true"
    >
      <span>{String(title).trim().charAt(0).toUpperCase() || '?'}</span>
    </div>
  )
}
