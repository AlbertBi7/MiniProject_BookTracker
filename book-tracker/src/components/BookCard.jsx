import { memo, useCallback, useEffect, useRef, useState } from 'react'

import BookCover from './BookCover.jsx'
import Highlight from './Highlight.jsx'
import StatusSelect from './StatusSelect.jsx'
import { MAX_AUTHOR, MAX_NOTE, MAX_RATING, MAX_TITLE, MSG, STATUS, STATUS_LABELS } from '../utils/constants.js'
import { validateBook } from '../utils/validate.js'

/**
 * A single shelf row: cover thumbnail, titles, status controls, rating,
 * note and the edit / delete / find-cover actions.
 *
 * @param {Object} props
 * @param {import('../state/booksReducer.js').Book} props.book
 * @param {string} [props.highlight]
 * @param {(action: {type: string, payload?: any}) => void} [props.dispatch]
 * @param {(id: string, patch: object) => void} [props.onUpdate]
 * @param {(id: string) => void} [props.onDelete]
 * @param {(id: string) => void} [props.onFindCover]
 * @param {(title: string, author: string, ignoreId?: string) => boolean} [props.isDuplicate]
 */
function BookCard({ book, highlight = '', dispatch, onUpdate, onDelete, onFindCover, isDuplicate }) {
  const [editing, setEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(book.title)
  const [draftAuthor, setDraftAuthor] = useState(book.author)
  const [draftError, setDraftError] = useState(null)
  const [duplicate, setDuplicate] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [note, setNote] = useState(book.note)

  const editButtonRef = useRef(null)
  const titleInputRef = useRef(null)
  const wasEditingRef = useRef(false)

  useEffect(() => {
    setNote(book.note)
  }, [book.note])

  const update = useCallback(
    (patch) => {
      if (onUpdate) onUpdate(book.id, patch)
      else dispatch?.({ type: 'UPDATE', payload: { id: book.id, patch } })
    },
    [book.id, dispatch, onUpdate],
  )

  const resetDraft = useCallback(() => {
    setDraftTitle(book.title)
    setDraftAuthor(book.author)
    setDraftError(null)
    setDuplicate('')
    setConfirmed(false)
  }, [book.author, book.title])

  const startEdit = useCallback(() => {
    resetDraft()
    setEditing(true)
  }, [resetDraft])

  const endEdit = useCallback(() => {
    setEditing(false)
    setDuplicate('')
    setConfirmed(false)
    setDraftError(null)
  }, [])

  // Focus the first edit field on open, and hand focus back to Edit on close.
  useEffect(() => {
    if (editing) {
      titleInputRef.current?.focus()
    } else if (wasEditingRef.current) {
      editButtonRef.current?.focus()
    }
    wasEditingRef.current = editing
  }, [editing])

  const handleDraftTitleChange = useCallback((event) => {
    setDraftTitle(event.target.value)
    setDraftError(null)
    setDuplicate('')
    setConfirmed(false)
  }, [])

  const handleDraftAuthorChange = useCallback((event) => {
    setDraftAuthor(event.target.value)
    setDuplicate('')
    setConfirmed(false)
  }, [])

  const saveEdit = useCallback(
    (event) => {
      event?.preventDefault?.()
      const trimmedTitle = draftTitle.trim()
      const trimmedAuthor = draftAuthor.trim()
      const { valid, errors } = validateBook({ title: draftTitle, author: draftAuthor })

      if (!valid) {
        setDraftError(errors.title ?? errors.author)
        return
      }

      const unchanged = trimmedTitle === book.title && trimmedAuthor === book.author
      const isDupe =
        !unchanged &&
        typeof isDuplicate === 'function' &&
        isDuplicate(trimmedTitle, trimmedAuthor, book.id)

      if (isDupe && !confirmed) {
        setDuplicate(MSG.duplicate)
        setConfirmed(true)
        return
      }

      if (!unchanged) {
        // A new identity invalidates the stored cover so a fresh lookup runs.
        update({
          title: trimmedTitle,
          author: trimmedAuthor,
          coverUrl: null,
          coverStatus: 'none',
        })
      }
      endEdit()
    },
    [book.id, book.title, book.author, confirmed, draftAuthor, draftTitle, endEdit, isDuplicate, update],
  )

  const handleDraftKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        saveEdit(event)
      } else if (event.key === 'Escape') {
        event.preventDefault()
        endEdit()
      }
    },
    [endEdit, saveEdit],
  )

  const handleDelete = useCallback(() => {
    if (onDelete) onDelete(book.id)
    else dispatch?.({ type: 'DELETE', payload: { id: book.id } })
  }, [book.id, dispatch, onDelete])

  const handleStatusChange = useCallback(
    (status) => {
      dispatch?.({ type: 'SET_STATUS', payload: { id: book.id, status } })
    },
    [book.id, dispatch],
  )

  const handleRate = useCallback(
    (rating) => {
      update({ rating })
    },
    [update],
  )

  const handleNoteBlur = useCallback(() => {
    const trimmed = note.slice(0, MAX_NOTE)
    if (trimmed !== book.note) update({ note: trimmed })
  }, [book.note, note, update])

  const handleFindCover = useCallback(() => {
    if (onFindCover) onFindCover(book.id)
    else dispatch?.({ type: 'SET_COVER', payload: { id: book.id, coverUrl: null, coverStatus: 'none' } })
  }, [book.id, dispatch, onFindCover])

  const isFinished = book.status === STATUS.FINISHED

  return (
    <article className="book-card" data-status={book.status} data-book-id={book.id} tabIndex={-1}>
      <BookCover title={book.title} coverUrl={book.coverUrl} coverStatus={book.coverStatus} />

      <div className="book-card__body">
        {editing ? (
          <form className="book-card__edit" onSubmit={saveEdit}>
            <div className="book-card__edit-field">
              <label className="visually-hidden" htmlFor={`edit-title-${book.id}`}>
                Title
              </label>
              <input
                id={`edit-title-${book.id}`}
                ref={titleInputRef}
                type="text"
                value={draftTitle}
                maxLength={MAX_TITLE}
                aria-label={`Title for ${book.title}`}
                aria-invalid={Boolean(draftError)}
                onChange={handleDraftTitleChange}
                onKeyDown={handleDraftKeyDown}
              />
            </div>
            <div className="book-card__edit-field">
              <label className="visually-hidden" htmlFor={`edit-author-${book.id}`}>
                Author
              </label>
              <input
                id={`edit-author-${book.id}`}
                type="text"
                value={draftAuthor}
                maxLength={MAX_AUTHOR}
                aria-label={`Author for ${book.title}`}
                onChange={handleDraftAuthorChange}
                onKeyDown={handleDraftKeyDown}
              />
            </div>

            {draftError ? (
              <p className="field-error" role="alert">
                {draftError}
              </p>
            ) : null}
            {duplicate ? (
              <p className="book-form__warning" role="alert">
                {duplicate}
              </p>
            ) : null}

            <div className="book-card__actions">
              <button type="submit" className="btn btn--primary">
                {confirmed ? MSG.saveAnyway : MSG.save}
              </button>
              <button type="button" className="btn btn--ghost" onClick={endEdit}>
                {MSG.cancel}
              </button>
            </div>
          </form>
        ) : (
          <>
            <h3 className="book-card__title">
              <Highlight text={book.title} term={highlight} />
            </h3>
            <p className="book-card__author">
              <Highlight text={book.author} term={highlight} />
            </p>
          </>
        )}

        <div className="book-card__meta">
          <span className="badge" data-status={book.status}>
            {STATUS_LABELS[book.status]}
          </span>

          <StatusSelect
            value={book.status}
            onChange={handleStatusChange}
            label={`Status for ${book.title}`}
          />

          {isFinished ? (
            <fieldset className="rating" aria-label={`Rating for ${book.title}`}>
              {Array.from({ length: MAX_RATING }, (_, index) => index + 1).map((value) => (
                <label key={value} className="rating__star-label">
                  <input
                    className="rating__input"
                    type="radio"
                    name={`rating-${book.id}`}
                    value={value}
                    checked={book.rating === value}
                    aria-label={`Rate ${value} out of 5`}
                    onChange={() => handleRate(value)}
                    onClick={() => {
                      // Clicking the current rating clears it.
                      if (book.rating === value) handleRate(0)
                    }}
                  />
                  <span
                    aria-hidden="true"
                    className={value <= book.rating ? 'rating__star is-on' : 'rating__star'}
                  >
                    ★
                  </span>
                </label>
              ))}
            </fieldset>
          ) : null}
        </div>

        <textarea
          className="book-card__note"
          rows={2}
          value={note}
          maxLength={MAX_NOTE}
          placeholder="Add a note"
          aria-label={`Note for ${book.title}`}
          onChange={(event) => setNote(event.target.value)}
          onBlur={handleNoteBlur}
        />
        <p className="note-counter">
          {note.length}/{MAX_NOTE}
        </p>

        <div className="book-card__actions">
          <button
            type="button"
            className="btn btn--ghost"
            ref={editButtonRef}
            onClick={startEdit}
          >
            {MSG.edit}
          </button>

          {!book.coverUrl ? (
            <button type="button" className="btn btn--ghost" onClick={handleFindCover}>
              {MSG.findCover}
            </button>
          ) : null}

          <button
            type="button"
            className="btn btn--danger"
            aria-label={`Delete ${book.title}`}
            onClick={handleDelete}
          >
            {MSG.del}
          </button>
        </div>

        {book.coverStatus === 'missing' ? (
          <p className="book-card__hint">{MSG.noCover}</p>
        ) : null}
      </div>
    </article>
  )
}

export default memo(BookCard)
