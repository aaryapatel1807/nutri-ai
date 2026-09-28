'use client'
import { useState } from 'react'
import Sidebar from '../components/shared/Sidebar'
import Navbar from '../components/shared/Navbar'
import PageWrapper from '../components/shared/PageWrapper'
import { usePathname } from 'next/navigation'

export default function LayoutContent({ children }) {
  const pathname = usePathname()
  const hideLayout = pathname === '/' || pathname === '/onboarding'
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (hideLayout) {
    return <>{children}</>
  }

  return (
    <>
      <Sidebar mobileOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      <Navbar onMenuClick={() => setSidebarOpen((open) => !open)} />
      <PageWrapper>
        {children}
      </PageWrapper>
    </>
  )
}
