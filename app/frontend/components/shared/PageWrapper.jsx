'use client'

export default function PageWrapper({ children }) {
  return (
    <div style={{
      paddingLeft: '260px', // Match Sidebar width
      paddingTop: '80px',  // Match Navbar height
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      zIndex: 1,
      background: '#0A0A0F',
      boxSizing: 'border-box',
    }}>
      <div style={{ padding: '32px', flex: 1, width: '100%', maxWidth: '1600px', margin: '0 auto', boxSizing: 'border-box' }}>
        {children}
      </div>
    </div>
  )
}
