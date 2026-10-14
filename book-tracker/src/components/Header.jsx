import { useCallback, useRef } from 'react'

/**
 * App header: title, theme toggle, export / import backup and the
 * "Fetch covers" setting.
 *
 * @param {Object} props
 * @param {'system'|'light'|'dark'} [props.theme]
 * @param {() => void} [props.onToggleTheme]
 * @param {() => void} [props.onExport]
 * @param {(text: string) => void} [props.onImport] receives the raw file text
 * @param {boolean} [props.fetchCovers]
 * @param {(checked: boolean) => void} [props.onToggleFetchCovers]
 */
export default function Header({
  theme = 'system',
  onToggleTheme,
  onExport,
  onImport,
  fetchCovers = true,
  onToggleFetchCovers,
}) {
  const fileInputRef = useRef(null)

  const handleToggleTheme = useCallback(() => {
    onToggleTheme?.()
  }, [onToggleTheme])

  const handleExport = useCallback(() => {
    onExport?.()
  }, [onExport])

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleImportChange = useCallback(
    (event) => {
      const input = event.target
      const file = input.files && input.files[0]
      if (!file) return
      Promise.resolve()
        .then(() => file.text())
        .then((text) => onImport?.(text))
        .catch(() => onImport?.(''))
        .finally(() => {
          // Reset so the very same file can be picked again.
          input.value = ''
        })
    },
    [onImport],
  )

  const handleFetchCoversChange = useCallback(
    (event) => {
      onToggleFetchCovers?.(event.target.checked)
    },
    [onToggleFetchCovers],
  )

  return (
    <header className="app-header">
      <h1 className="app-header__title">Book Tracker</h1>

      <div className="app-header__actions">
        <button
          type="button"
          className="btn btn--icon"
          aria-label={`Theme: ${theme}. Switch theme`}
          onClick={handleToggleTheme}
        >
          <span aria-hidden="true">◐</span>
        </button>

        <button type="button" className="btn btn--ghost" onClick={handleExport}>
          Export
        </button>

        <button type="button" className="btn btn--ghost" onClick={handleImportClick}>
          Import
        </button>

        <input
          ref={fileInputRef}
          className="visually-hidden"
          type="file"
          accept=".json,application/json"
          aria-label="Import a Book Tracker backup file"
          onChange={handleImportChange}
        />

        <label className="app-header__setting">
          <input type="checkbox" checked={fetchCovers} onChange={handleFetchCoversChange} />
          <span>Fetch covers</span>
        </label>
      </div>
    </header>
  )
}
