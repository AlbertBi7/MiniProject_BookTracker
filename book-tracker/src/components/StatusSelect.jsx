import { useCallback } from 'react'

import { STATUS_LIST, STATUS_LABELS } from '../utils/constants.js'

/**
 * Per-book status picker (To read / Reading / Finished).
 *
 * @param {Object} props
 * @param {'to-read'|'reading'|'finished'} props.value
 * @param {(status: string) => void} [props.onChange]
 * @param {string} [props.label]  accessible name, e.g. "Status for Aadujeevitham"
 */
export default function StatusSelect({ value, onChange, label = 'Status' }) {
  const handleChange = useCallback(
    (event) => {
      onChange?.(event.target.value)
    },
    [onChange],
  )

  return (
    <label className="status-select">
      <span className="visually-hidden">{label}</span>
      <select value={value} aria-label={label} onChange={handleChange}>
        {STATUS_LIST.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABELS[status]}
          </option>
        ))}
      </select>
    </label>
  )
}
