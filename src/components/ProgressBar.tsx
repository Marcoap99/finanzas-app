interface Props {
  value: number
  max: number
  color?: string
  height?: number
}

export default function ProgressBar({ value, max, color = '#4F46E5', height = 7 }: Props) {
  const pct = Math.min(100, Math.round((value / (max || 1)) * 100))
  return (
    <div className="w-full bg-gray-100 rounded-full overflow-hidden" style={{ height }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  )
}
