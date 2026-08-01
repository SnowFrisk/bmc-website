import { useEffect, useState } from 'react'

const THEME_STORAGE_KEY = 'bmc-theme'
const THEME_ATTRIBUTE = 'data-theme'

function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark'
  return localStorage.getItem(THEME_STORAGE_KEY) || 'dark'
}

function applyTheme(theme) {
  document.documentElement.setAttribute(THEME_ATTRIBUTE, theme)
  localStorage.setItem(THEME_STORAGE_KEY, theme)
}

let themeState = getInitialTheme()
if (typeof window !== 'undefined') {
  applyTheme(themeState)
}

const listeners = new Set()

function setSharedTheme(nextTheme) {
  if (themeState === nextTheme) return
  themeState = nextTheme
  applyTheme(themeState)
  for (const listener of listeners) {
    listener(themeState)
  }
}

export function useTheme() {
  const [theme, setTheme] = useState(themeState)

  useEffect(() => {
    const handleThemeChange = nextTheme => {
      setTheme(nextTheme)
    }

    listeners.add(handleThemeChange)

    const handleStorageChange = event => {
      if (event.key !== THEME_STORAGE_KEY || !event.newValue) return
      setSharedTheme(event.newValue)
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      listeners.delete(handleThemeChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const toggleTheme = () =>
    setSharedTheme(themeState === 'dark' ? 'light' : 'dark')

  return { theme, toggleTheme }
}