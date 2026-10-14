import { useEffect } from 'react'

import { SEARCH_SHORTCUT } from '../utils/constants.js'

const isTypingTarget = (target) => {
  if (!target || typeof target !== 'object') return false
  if (target.isContentEditable) return true
  const tag = typeof target.tagName === 'string' ? target.tagName.toUpperCase() : ''
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

/**
 * Global keyboard shortcuts.
 *   "/"  — focus the search input (ignored while typing, preventDefault)
 *   Esc  — clear the search input while it has focus
 *
 * @param {React.RefObject<HTMLInputElement>} searchRef
 * @param {() => void} onClear
 */
export function useKeyboardShortcuts(searchRef, onClear) {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.defaultPrevented) return

      if (
        event.key === SEARCH_SHORTCUT &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isTypingTarget(event.target)
      ) {
        const input = searchRef?.current
        if (!input) return
        event.preventDefault()
        input.focus()
        if (typeof input.select === 'function') input.select()
        return
      }

      if (event.key === 'Escape') {
        const input = searchRef?.current
        if (!input) return
        const isActive =
          (typeof document !== 'undefined' && document.activeElement === input) ||
          (typeof input.value === 'string' && input.value !== '')
        if (!isActive) return
        event.preventDefault()
        onClear?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchRef, onClear])
}

export { SEARCH_SHORTCUT }

export default useKeyboardShortcuts
