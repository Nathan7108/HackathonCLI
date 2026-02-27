interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  fill?: boolean
}

export function Sparkline({
  data,
  width = 60,
  height = 20,
  color = 'var(--color-accent)',
  fill = false,
}: SparklineProps) {
  if (!data.length) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * height
    return `${x},${y}`
  })

  const pathD = `M ${points.join(' L ')}`
  const fillD = `${pathD} L ${width},${height} L 0,${height} Z`

  return (
    <svg width={width} height={height} className="flex-shrink-0">
      {fill && (
        <path d={fillD} fill={color} fillOpacity={0.15} />
      )}
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
