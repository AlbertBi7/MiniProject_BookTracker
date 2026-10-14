import { useCallback, useRef, useState } from 'react'

import { MAX_AUTHOR, MAX_TITLE, MSG, STATUS, STATUS_LABELS, STATUS_LIST } from '../utils/constants.js'
import { validateBook } from '../utils/validate.js'

/**
 * The "add a book" form: title, author, initial status.
 * Errors render as <p role="alert"> and are linked with aria-describedby
 * + aria-invalid; the duplicate case uses a separate warning slot that turns
 * the submit button into "Add anyway".
 *
 * @param {Object} props
 * @param {(book: { title: string, author: string, status: string, allowDuplicate?: boolean }) => void} [props.onAdd]
 * @param {string} [props.duplicateWarning]  externally supplied warning text
 * @param {React.RefObject<HTMLInputElement>} [props.titleRef]  refocused after a successful add
 * @param {(title: string, author: string) => boolean} [props.isDuplicate]
 */
export default function AddBookForm({ onAdd, duplicateWarning = '', titleRef, isDuplicate }) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [status, setStatus] = useState(STATUS.TO_READ)
  const [errors, setErrors] = useState({})
  const [duplicate, setDuplicate] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const internalTitleRef = useRef(null)
  const authorRef = useRef(null)
  const titleInputRef = titleRef ?? internalTitleRef

  const resetWarnings = useCallback(() => {
    setDuplicate('')
    setConfirmed(false)
  }, [])

  const handleTitleChange = useCallback(
    (event) => {
      setTitle(event.target.value)
      // Errors clear as the user types.
      setErrors((current) => (current.title ? { ...current, title: undefined } : current))
      resetWarnings()
    },
    [resetWarnings],
  )

  const handleAuthorChange = useCallback(
    (event) => {
      setAuthor(event.target.value)
      setErrors((current) => (current.author ? { ...current, author: undefined } : current))
      resetWarnings()
    },
    [resetWarnings],
  )

  const handleStatusChange = useCallback((event) => {
    setStatus(event.target.value)
  }, [])

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault()

      const trimmedTitle = title.trim()
      const trimmedAuthor = author.trim()
      const { valid, errors: nextErrors } = validateBook({ title, author })

      if (!valid) {
        setErrors(nextErrors)
        resetWarnings()
        // Focus the first field that failed.
        if (nextErrors.title) titleInputRef.current?.focus()
        else if (nextErrors.author) authorRef.current?.focus()
        return
      }

      const isDupe =
        duplicateWarning !== '' ||
        (typeof isDuplicate === 'function' && isDuplicate(trimmedTitle, trimmedAuthor))

      // First duplicate submit only warns; the second one ("Add anyway") commits.
      if (isDupe && !confirmed) {
        setDuplicate(MSG.duplicate)
        setConfirmed(true)
        return
      }

      onAdd?.({
        title: trimmedTitle,
        author: trimmedAuthor,
        status,
        allowDuplicate: Boolean(isDupe),
      })

      setTitle('')
      setAuthor('')
      setStatus(STATUS.TO_READ)
      setErrors({})
      resetWarnings()
      titleInputRef.current?.focus()
    },
    [author, confirmed, duplicateWarning, isDuplicate, onAdd, resetWarnings, status, title, titleInputRef],
  )

  const titleError = errors.title
  const authorError = errors.author

  return (
    <form className="book-form" onSubmit={handleSubmit} noValidate>
      <div className="book-form__field">
        <label htmlFor="book-title">Title</label>
        <input
          id="book-title"
          name="title"
          type="text"
          ref={titleInputRef}
          value={title}
          autoComplete="off"
          maxLength={MAX_TITLE}
          onChange={handleTitleChange}
          aria-invalid={Boolean(titleError)}
          aria-describedby={titleError ? 'book-title-error' : undefined}
        />
        {titleError ? (
          <p className="field-error" id="book-title-error" role="alert">
            {titleError}
          </p>
        ) : null}
      </div>

      <div className="book-form__field">
        <label htmlFor="book-author">Author</label>
        <input
          id="book-author"
          name="author"
          type="text"
          ref={authorRef}
          value={author}
          autoComplete="off"
          maxLength={MAX_AUTHOR}
          onChange={handleAuthorChange}
          aria-invalid={Boolean(authorError)}
          aria-describedby={authorError ? 'book-author-error' : undefined}
        />
        {authorError ? (
          <p className="field-error" id="book-author-error" role="alert">
            {authorError}
          </p>
        ) : null}
      </div>

      <div className="book-form__field book-form__field--status">
        <label htmlFor="book-status">Status</label>
        <select id="book-status" name="status" value={status} onChange={handleStatusChange}>
          {STATUS_LIST.map((value) => (
            <option key={value} value={value}>
              {STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className="btn btn--primary book-form__submit">
        {confirmed ? MSG.addAnyway : 'Add'}
      </button>

      {duplicate || duplicateWarning ? (
        <p className="book-form__warning" role="alert">
          {duplicate || duplicateWarning}
        </p>
      ) : null}
    </form>
  )
}
