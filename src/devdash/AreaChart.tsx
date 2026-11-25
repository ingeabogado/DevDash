// Gráfica de área SVG con crosshair y tooltip. Sin dependencias.
import { useId, useMemo, useState, type PointerEvent } from "react"
import type { ChartPoint } from "./api"

const W = 720
const PAD = { l: 8, r: 8, t: 12, b: 28 }

interface Props {
  data: ChartPoint[]
  height?: number
  formatY: (v: number) => string
  formatX: (t: number) => string
  label: string
}

export function AreaChart({ data, height = 260, formatY, formatX, label }: Props) {
  const rawId = useId()
  const gid = useMemo(() => rawId.replace(/[^a-zA-Z0-9]/g, ""), [rawId])
  const [hover, setHover] = useState<number | null>(null)

  const model = useMemo(() => {
    if (data.length === 0) return null
    const vals = data.map((d) => d.p)
    let min = Math.min(...vals)
    let max = Math.max(...vals)
    if (min === max) {
      min -= Math.abs(min) * 0.01 + 1
      max += Math.abs(max) * 0.01 + 1
    }
    const iw = W - PAD.l - PAD.r
    const ih = height - PAD.t - PAD.b
    const x = (i: number) => (data.length === 1 ? PAD.l + iw / 2 : PAD.l + (i / (data.length - 1)) * iw)
    const y = (v: number) => PAD.t + (1 - (v - min) / (max - min)) * ih
    const pts = data.map((d, i) => ({ x: x(i), y: y(d.p) }))
    const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")
    const base = height - PAD.b
    const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${base} L${pts[0].x.toFixed(1)},${base} Z`
    return { pts, line, area, min, max, base, y }
  }, [data, height])

  if (!model) {
    return (
      <div
        role="img"
        aria-label={label}
        className="w-full flex items-center justify-center text-sm text-muted-foreground"
        style={{ height }}
      >
        Sin datos para graficar.
      </div>
    )
  }

  const n = data.length
  const mid = (model.min + model.max) / 2

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    if (rect.width === 0) return
    const ratio = (e.clientX - rect.left) / rect.width
    const px = ratio * W - PAD.l
    const iw = W - PAD.l - PAD.r
    const i = Math.round((px / iw) * (n - 1))
    setHover(Math.max(0, Math.min(n - 1, i)))
  }

  const hp = hover !== null ? model.pts[hover] : null

  return (
    <div className="relative" role="img" aria-label={label}>
      <svg
        viewBox={`0 0 ${W} ${height}`}
        className="w-full touch-manipulation"
        style={{ height }}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`ag-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--module-dev)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--module-dev)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[model.max, mid, model.min].map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={model.y(v)} y2={model.y(v)} stroke="var(--glass-border)" strokeWidth="1" />
            <text x={W - PAD.r} y={model.y(v) - 4} textAnchor="end" fontSize="11" fill="var(--muted-foreground)">
              {formatY(v)}
            </text>
          </g>
        ))}
        <path d={model.area} fill={`url(#ag-${gid})`} />
        <path
          d={model.line}
          fill="none"
          stroke="var(--module-dev)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {hp !== null && (
          <g>
            <line
              x1={hp.x}
              x2={hp.x}
              y1={PAD.t}
              y2={model.base}
              stroke="var(--foreground)"
              strokeOpacity="0.4"
              strokeDasharray="3 3"
            />
            <circle cx={hp.x} cy={hp.y} r="4.5" fill="var(--module-dev)" stroke="var(--background)" strokeWidth="2" />
          </g>
        )}
        {[data[0].t, data[Math.floor(n / 2)].t, data[n - 1].t].map((t, i) => (
          <text
            key={`${t}-${i}`}
            x={i === 0 ? PAD.l : i === 1 ? W / 2 : W - PAD.r}
            y={height - 8}
            textAnchor={i === 0 ? "start" : i === 1 ? "middle" : "end"}
            fontSize="11"
            fill="var(--muted-foreground)"
          >
            {formatX(t)}
          </text>
        ))}
      </svg>
      {hp !== null && hover !== null && (
        <div
          className="absolute top-0 pointer-events-none glass rounded-lg px-3 py-1.5 text-xs whitespace-nowrap"
          style={{ left: `${Math.min(78, Math.max(8, (hp.x / W) * 100))}%`, transform: "translateX(-50%)" }}
        >
          <span className="text-muted-foreground">{formatX(data[hover].t)}</span>{" "}
          <span className="font-bold text-foreground">{formatY(data[hover].p)}</span>
        </div>
      )}
    </div>
  )
}
