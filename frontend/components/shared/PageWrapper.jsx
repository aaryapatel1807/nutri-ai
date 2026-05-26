'use client'

export default function PageWrapper({ children }) {
  return (
      <div style={{
        marginLeft: '260px',
        paddingTop: '80px',
        paddingLeft: '32px',
        paddingRight: '32px',
        paddingBottom: '40px',
        minHeight: '100vh',
        width: 'calc(100% - 260px)',
        boxSizing: 'border-box',
        background: '#0A0A0F',
      }}>
        {children}
      </div>
  )
}
