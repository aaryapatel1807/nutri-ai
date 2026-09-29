'use client'
import { useState, useEffect } from 'react'
import AppSidebar from '../components/shared/AppSidebar'
import Navbar from '../components/shared/Navbar'
import PageWrapper from '../components/shared/PageWrapper'
import { ThemeProvider } from '../components/shared/ThemeContext'
import { usePathname } from 'next/navigation'

const SIDEBAR_COLLAPSED_KEY = 'nutriai_sidebar_collapsed'

export default function LayoutContent({ children }) {
  const pathname = usePathname()
  const hideLayout = pathname === '/' || pathname === '/onboarding'
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Restore the user's sidebar preference (desktop collapse)
  useEffect(() => {
    try {
      if (localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1') setSidebarCollapsed(true)
    } catch (e) {}
  }, [])

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0') } catch (e) {}
      return next
    })
  }

  if (hideLayout) {
    return <ThemeProvider>{children}</ThemeProvider>
  }

  return (
    <ThemeProvider>
      <AppSidebar
        mobileOpen={sidebarOpen}
        onNavigate={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapsed}
      />
      <Navbar
        onMenuClick={() => setSidebarOpen((open) => !open)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapsed}
      />
      <PageWrapper collapsed={sidebarCollapsed}>
        {children}
      </PageWrapper>
    </ThemeProvider>
  )
}
