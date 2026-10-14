import { useCallback, useEffect, useRef, useState } from 'react'

import { DEFAULT_THEME, THEMES } from '../utils/constants.js'
import { loadTheme, onExternalChange, saveTheme } from '../services/storage.js'

const prefersDark = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false

/**
 * Theme state: 'system' | 'light' | 'dark'.
 * Applies data-theme on <html> so tokens.css can switch, and persists the
 * choice. While on 'system' the app keeps following the OS.
 *
 * @returns {{ theme: string, resolvedTheme: string, setTheme: (theme: string) => void, toggleTheme: () => void }}
 */
export function useTheme() {
  const [theme, setThemeState] = useState(() => loadTheme())
  const [systemDark, setSystemDark] = useState(prefersDark)
  const lastSyncedRef = useRef(theme)

  // Follow OS changes while the user has not picked a theme.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (event) => setSystemDark(event.matches)
    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', handler)
      return () => query.removeEventListener('change', handler)
    }
    return undefined
  }, [])

  // Reflect the choice on <html> and persist real changes only.
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      if (theme === 'system') root.removeAttribute('data-theme')
      else root.setAttribute('data-theme', theme)
    }
    if (lastSyncedRef.current !== theme) {
      lastSyncedRef.current = theme
      saveTheme(theme)
    }
  }, [theme])

  // Keep tabs in step without writing the same value back and forth.
  useEffect(
    () =>
      onExternalChange(undefined, (next) => {
        if (!THEMES.includes(next)) return
        lastSyncedRef.current = next
        setThemeState(next)
      }),
    [],
  )

  const setTheme = useCallback((next) => {
    setThemeState(THEMES.includes(next) ? next : DEFAULT_THEME)
  }, [])

  const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const resolved =
        current === 'system' ? (prefersDark() ? 'dark' : 'light') : current
      return resolved === 'dark' ? 'light' : 'dark'
    })
  }, [])

  return { theme, resolvedTheme, setTheme, toggleTheme }
}

export default useTheme
