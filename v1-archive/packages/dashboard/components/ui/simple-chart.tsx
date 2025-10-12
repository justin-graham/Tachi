'use client'

import React from 'react'

interface SimpleChartProps {
  data: number[]
  height?: number
  color?: string
  className?: string
}

export function SimpleChart({ 
  data, 
  height = 120, 
  color = '#FF7043',
  className = '' 
}: SimpleChartProps) {
  const maxValue = Math.max(...data)
  const minValue = Math.min(...data)
  const range = maxValue - minValue || 1
  
  // Create SVG path for the line
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = 100 - ((value - minValue) / range) * 80 // Use 80% of height for better spacing
    return `${x},${y}`
  }).join(' ')
  
  return (
    <div className={`relative ${className}`} style={{ height }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        {/* Area fill */}
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        {/* Fill area under the line */}
        <polygon
          points={`0,100 ${points} 100,100`}
          fill="url(#chartGradient)"
        />
        
        {/* Main line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />
        
        {/* Data points */}
        {data.map((value, index) => {
          const x = (index / (data.length - 1)) * 100
          const y = 100 - ((value - minValue) / range) * 80
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="0.8"
              fill={color}
              vectorEffect="non-scaling-stroke"
            />
          )
        })}
      </svg>
      
      {/* Hover overlay for interactivity */}
      <div className="absolute inset-0 flex">
        {data.map((value, index) => (
          <div
            key={index}
            className="flex-1 relative group cursor-pointer"
            title={`$${value.toFixed(2)}`}
          >
            {/* Hover tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-[#1A1A1A] text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity font-mono">
              ${value.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}