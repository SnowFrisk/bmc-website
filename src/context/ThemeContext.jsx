
import { useCallback, useEffect, useState } from 'react'
import { ThemeContext as BaseThemeContext } from './themeContext.js'

export { ThemeContext } from './themeContext.js'

const THEME_STORAGE_KEY = 'bmc-theme'
const THEME_ATTRIBUTE = 'data-theme'

function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark'
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored) return stored
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light'
  }
  return 'dark'
}

function applyTheme(theme) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute(THEME_ATTRIBUTE, theme)
  localStorage.setItem(THEME_STORAGE_KEY, theme)
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === THEME_STORAGE_KEY && event.newValue) {
        setTheme(event.newValue)
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      return next
    })
  }, [])

  return (
    <BaseThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </BaseThemeContext.Provider>
  )
}