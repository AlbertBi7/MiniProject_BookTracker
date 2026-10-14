import { useEffect, useState } from 'react'

import { DEBOUNCE_MS } from '../utils/constants.js'

/**
 * Return `value` delayed by `delay` ms (defaults to DEBOUNCE_MS).
 *
 * Not used by the search box (the shelf is small enough to filter on every
 * keystroke) but available for anything that needs it.
 *
 * @template T
 * @param {T} value
 * @param {number} [delay]
 * @returns {T}
 */
export function useDebouncedValue(value, delay = DEBOUNCE_MS) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), Math.max(0, delay))
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

export default useDebouncedValue
