'use client'
import { useState } from 'react'
import Sidebar from '../components/shared/Sidebar'
import Navbar from '../components/shared/Navbar'
import PageWrapper from '../components/shared/PageWrapper'
import { ThemeProvider } from '../components/shared/ThemeContext'
import { usePathname } from 'next/navigation'

export default function LayoutContent({ children }) {
  const pathname = usePathname()
  const hideLayout = pathname === '/' || pathname === '/onboarding'
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (hideLayout) {
    return <ThemeProvider>{children}</ThemeProvider>
  }

  return (
    <ThemeProvider>
      <Sidebar mobileOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      <Navbar onMenuClick={() => setSidebarOpen((open) => !open)} />
      <PageWrapper>
        {children}
      </PageWrapper>
    </ThemeProvider>
  )
}
