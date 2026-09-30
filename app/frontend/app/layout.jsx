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
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('nutriai_theme');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t;}catch(e){}})()` }} />
      </head>
      <body className={inter.className}>
        <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
          {/* Frosted-glass page backdrop: color wash + frost veil + grain + sheen */}
          <div className="frosted-backdrop" aria-hidden="true">
            <div className="frost-orb frost-orb-a" />
            <div className="frost-orb frost-orb-b" />
            <div className="frost-orb frost-orb-c" />
            <div className="frost-orb frost-orb-d" />
            <div className="frost-veil" />
            <div className="frost-grain" />
            <div className="frost-sheen" />
            <div className="frost-vignette" />
          </div>
          <LayoutContent>
            {children}
          </LayoutContent>
        </div>
      </body>
    </html>
  )
}
