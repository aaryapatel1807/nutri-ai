'use client'
import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {}, setTheme: () => {} })
const STORAGE_KEY = 'nutriai_theme'

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof document === 'undefined') return 'light'
    const t = document.documentElement.dataset.theme
    if (t === 'dark' || t === 'light') return t
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'dark' || saved === 'light') {
        setThemeState(saved)
        document.documentElement.dataset.theme = saved
      }
    } catch {}
  }, [])

  const setTheme = (t) => {
    setThemeState(t)
    document.documentElement.dataset.theme = t
    try { localStorage.setItem(STORAGE_KEY, t) } catch {}
  }
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light')

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
