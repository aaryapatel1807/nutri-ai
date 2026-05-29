'use client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

export default function ForecastChart({ actualData, forecastData }) {
  const combinedData = [
    ...actualData.map(d => ({ ...d, type: 'actual' })),
    ...forecastData.map(d => ({ ...d, type: 'forecast' }))
  ]

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass border border-white/10 rounded-lg p-2">
          <p className="text-white text-sm">
            {payload[0].value.toFixed(1)} kg
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div style={{ width: '100%', height: 130 }}>
      <ResponsiveContainer>
        <AreaChart data={combinedData}>
          <defs>
            <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00FF87" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#00FF87" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7B61FF" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#7B61FF" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <Area
            type="monotone"
            dataKey="value"
            stroke="#00FF87"
            strokeWidth={2}
            fill="url(#greenGrad)"
            data={actualData}
          />
          
          <Area
            type="monotone"
            dataKey="value"
            stroke="#7B61FF"
            strokeWidth={2}
            strokeDasharray="5 5"
            fill="url(#purpleGrad)"
            data={forecastData}
          />
          
          <ReferenceLine 
            x={actualData.length - 1} 
            stroke="rgba(255,255,255,0.2)" 
            strokeWidth={1}
          />
          
          <Tooltip content={<CustomTooltip />} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
