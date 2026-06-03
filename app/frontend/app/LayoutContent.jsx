'use client'
import Sidebar from '../components/shared/Sidebar'
import Navbar from '../components/shared/Navbar'
import PageWrapper from '../components/shared/PageWrapper'
import { usePathname } from 'next/navigation'

export default function LayoutContent({ children }) {
  const pathname = usePathname()
  const hideLayout = pathname === '/' || pathname === '/onboarding'

  if (hideLayout) {
    return <>{children}</>
  }

  return (
    <>
      <Sidebar />
      <Navbar />
      <PageWrapper>
        {children}
      </PageWrapper>
    </>
  )
}
