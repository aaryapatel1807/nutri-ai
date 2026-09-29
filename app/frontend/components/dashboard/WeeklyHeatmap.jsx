'use client'
import { motion } from 'framer-motion'

export default function WeeklyHeatmap({ data }) {
  if (!data || !Array.isArray(data)) return null;

  return (
    <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
      {data.map((item, i) => (
        <div key={i} style={{ textAlign: 'center', flex: 1 }}>
          <div style={{
            width: '100%',
            aspectRatio: '1/1',
            borderRadius: '10px',
            background: !item.calories
              ? 'var(--border)'
              : item.calories >= item.goal
                ? 'rgba(21, 178, 207,0.65)'
                : item.calories >= item.goal * 0.7
                  ? 'rgba(21, 178, 207,0.35)'
                  : 'rgba(21, 178, 207,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 4px'
          }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-primary)' }}>
              {item.calories || ''}
            </span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.day}</div>
        </div>
      ))}
    </div>
  )
}
