import { useCallback } from 'react'

import { MSG } from '../utils/constants.js'

/**
 * Single transient message with an optional Undo action (used after delete).
 * Only one toast exists at a time; a new one replaces it.
 *
 * @param {Object} props
 * @param {{message?: string, undoLabel?: string, onUndo?: () => void} | null} [props.toast]
 * @param {() => void} [props.onClose]
 */
export default function Toast({ toast = null, onClose }) {
  const handleUndo = useCallback(() => {
    toast?.onUndo?.()
    onClose?.()
  }, [onClose, toast])

  const handleClose = useCallback(() => {
    onClose?.()
  }, [onClose])

  if (!toast) return null

  return (
    <div className="toast" role="status" aria-live="polite">
      <span className="toast__message">{toast.message}</span>

      {toast.onUndo ? (
        <button type="button" className="btn btn--link" onClick={handleUndo}>
          {toast.undoLabel ?? MSG.undo}
        </button>
      ) : null}

      <button
        type="button"
        className="btn btn--icon toast__close"
        aria-label="Dismiss message"
        onClick={handleClose}
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  )
}
