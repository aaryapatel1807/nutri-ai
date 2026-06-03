import { Inter } from 'next/font/google'
import './globals.css'
import '../styles/performance.css'
import LayoutContent from './LayoutContent'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'NutriAI — Your AI Health Coach',
  description: 'Your intelligent nutrition and fitness companion powered by AI',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link 
          rel="stylesheet" 
          href="https://api.fontshare.com/v2/css?f[]=clash-display@700,600&f[]=satoshi@400,500,700&display=swap"
        />
      </head>
      <body className={inter.className}>
        <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
          {/* Background Orbs */}
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '500px',
              height: '500px',
              background: 'radial-gradient(rgba(0,255,135,0.04) 0%, transparent 70%)',
              animation: 'float 8s ease-in-out infinite',
              zIndex: -1,
              pointerEvents: 'none'
            }}
          />
          <div 
            style={{
              position: 'fixed',
              bottom: 0,
              right: 0,
              width: '600px',
              height: '600px',
              background: 'radial-gradient(rgba(123,97,255,0.03) 0%, transparent 70%)',
              animation: 'float 12s ease-in-out infinite reverse',
              zIndex: -1,
              pointerEvents: 'none'
            }}
          />
          <div 
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '350px',
              height: '350px',
              background: 'radial-gradient(rgba(255,107,53,0.025) 0%, transparent 70%)',
              animation: 'float 10s ease-in-out infinite 2s',
              zIndex: -1,
              pointerEvents: 'none'
            }}
          />
          
          <LayoutContent>
            {children}
          </LayoutContent>
        </div>
      </body>
    </html>
  )
}
