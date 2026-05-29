'use client'

export default function MacroBar({ label, current, goal, color }) {
  const percent = Math.min((current / goal) * 100, 100)
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '6px'
      }}>
        <span style={{
          color: '#F0F0FF',
          fontSize: '0.85rem',
          fontFamily: "'Satoshi', sans-serif"
        }}>{label}</span>
        <span style={{
          color: color,
          fontSize: '0.85rem',
          fontWeight: 600
        }}>{current}g</span>
      </div>
      <div style={{
        height: '8px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '99px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${percent}%`,
          background: color,
          borderRadius: '99px',
          transition: 'width 1s ease'
        }} />
      </div>
      <div style={{
        color: '#6B7280',
        fontSize: '0.75rem',
        marginTop: '3px'
      }}>{Math.round(percent)}% of {goal}g</div>
    </div>
  )
}
