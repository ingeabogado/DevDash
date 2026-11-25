// DevDash: dashboard cripto en vivo (demo de portafolio).
// TypeScript + React + SVG, datos de la API pública de CoinGecko.
import { useCallback, useEffect, useState } from "react"
import { AreaChart } from "./AreaChart"
import {
  fetchChart,
  fetchMarkets,
  formatCompact,
  formatMoney,
  formatTime,
  type ChartPoint,
  type MarketCoin,
  type VsCurrency,
} from "./api"

const RANGES = [
  { days: 1, label: "24H" },
  { days: 7, label: "7D" },
  { days: 30, label: "30D" },
]

const CURRENCIES: { value: VsCurrency; label: string }[] = [
  { value: "usd", label: "USD" },
  { value: "mxn", label: "MXN" },
  { value: "eur", label: "EUR" },
]

const REFRESH_MS = 60_000

function Sparkline({ prices, up }: { prices: number[]; up: boolean }) {
  const w = 96
  const h = 28
  if (prices.length < 2) return <span className="text-xs text-muted-foreground">—</span>
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const span = max - min || 1
  const pts = prices
    .map((p, i) => `${((i / (prices.length - 1)) * w).toFixed(1)},${(h - 2 - ((p - min) / span) * (h - 4)).toFixed(1)}`)
    .join(" ")
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-24 h-7" aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={up ? "var(--module-dev)" : "var(--module-fotografia)"}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Skeleton({ className }: { className: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-xl bg-white/5 ${className}`} />
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : "No se pudo cargar."
}

export function DevDash() {
  const [vs, setVs] = useState<VsCurrency>("usd")
  const [coinId, setCoinId] = useState("bitcoin")
  const [days, setDays] = useState(7)
  const [markets, setMarkets] = useState<MarketCoin[] | null>(null)
  const [chart, setChart] = useState<ChartPoint[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartBusy, setChartBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  const loadAll = useCallback(async (v: VsCurrency, id: string, d: number, initial = false) => {
    if (initial) setLoading(true)
    else setChartBusy(true)
    setError(null)
    try {
      const [m, c] = await Promise.all([fetchMarkets(v), fetchChart(id, v, d)])
      setMarkets(m)
      setChart(c)
      setUpdatedAt(new Date())
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
      setChartBusy(false)
    }
  }, [])

  useEffect(() => {
    void loadAll("usd", "bitcoin", 7, true)
  }, [loadAll])

  useEffect(() => {
    const t = setInterval(() => {
      if (!document.hidden) void loadAll(vs, coinId, days)
    }, REFRESH_MS)
    return () => clearInterval(t)
  }, [vs, coinId, days, loadAll])

  const reloadChart = useCallback((id: string, v: VsCurrency, d: number) => {
    setChartBusy(true)
    setError(null)
    fetchChart(id, v, d)
      .then((c) => {
        setChart(c)
        setUpdatedAt(new Date())
      })
      .catch((e: unknown) => setError(errMsg(e)))
      .finally(() => setChartBusy(false))
  }, [])

  const pickCoin = (id: string) => {
    if (id === coinId) return
    setCoinId(id)
    reloadChart(id, vs, days)
  }

  const changeVs = (v: VsCurrency) => {
    if (v === vs) return
    setVs(v)
    void loadAll(v, coinId, days)
  }

  const changeDays = (d: number) => {
    if (d === days) return
    setDays(d)
    reloadChart(coinId, vs, d)
  }

  const selected = markets?.find((m) => m.id === coinId) ?? null
  const rangeLabel = RANGES.find((r) => r.days === days)?.label ?? ""
  const pct = selected?.price_change_percentage_24h ?? 0
  const pctUp = pct >= 0

  return (
    <div className="flex flex-col gap-5">
      <div>
        <a
          href="https://www.ingeabogado.com/dev"
          className="text-sm text-muted-foreground underline underline-offset-4"
        >
          ← Ver en ingeabogado.com
        </a>
        <h1 className="text-3xl md:text-5xl font-bold mt-2 mb-2" style={{ color: "var(--module-dev)" }}>
          DevDash
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Dashboard cripto en vivo: filtros por moneda y rango, gráficas SVG propias y auto-refresh cada 60 s.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          TypeScript · React · API pública CoinGecko ·{" "}
          <a href="https://github.com/ingeabogado/DevDash" className="underline underline-offset-4">
            Repositorio en GitHub
          </a>{" "}
          · Desarrollado por José Andrés Dávila L. 2026. Licencia libre.
        </p>
      </div>

      {error && (
        <div role="alert" className="glass rounded-2xl p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
          <p className="text-sm text-foreground flex-1">{error}</p>
          <button
            type="button"
            onClick={() => void loadAll(vs, coinId, days)}
            className="rounded-xl min-h-[44px] px-5 text-sm font-medium glass touch-manipulation"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="glass rounded-2xl p-4 md:p-5 flex flex-col gap-4">
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Moneda">
          {markets === null ? (
            <Skeleton className="h-11 w-full shrink-0" />
          ) : (
            markets.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => pickCoin(m.id)}
                aria-pressed={m.id === coinId}
                className="shrink-0 rounded-xl min-h-[44px] px-4 text-sm font-medium touch-manipulation"
                style={
                  m.id === coinId
                    ? { background: "var(--module-dev)", color: "#fff" }
                    : { background: "var(--glass-bg)", color: "var(--foreground)" }
                }
              >
                {m.symbol.toUpperCase()}
              </button>
            ))
          )}
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-2" role="group" aria-label="Divisa">
            {CURRENCIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => changeVs(c.value)}
                aria-pressed={c.value === vs}
                className="rounded-xl min-h-[44px] px-4 text-sm font-medium touch-manipulation"
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2" role="group" aria-label="Rango">
            {RANGES.map((r) => (
              <button
                key={r.days}
                type="button"
                onClick={() => changeDays(r.days)}
                aria-pressed={r.days === days}
                className="rounded-xl min-h-[44px] px-4 text-sm font-medium touch-manipulation"
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void loadAll(vs, coinId, days)}
            disabled={chartBusy}
            className="rounded-xl min-h-[44px] px-4 text-sm font-medium glass touch-manipulation disabled:opacity-40"
          >
            {chartBusy ? "Actualizando…" : "↻ Actualizar"}
          </button>
          {updatedAt && (
            <p className="text-xs text-muted-foreground ml-auto">
              Actualizado{" "}
              {updatedAt.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
          )}
        </div>
      </div>

      {loading || selected === null ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Precio", value: formatMoney(selected.current_price, vs) },
            {
              label: "Cambio 24h",
              value: `${pctUp ? "+" : ""}${pct.toFixed(2)} %`,
              tone: pctUp ? "var(--module-dev)" : "var(--module-fotografia)",
            },
            { label: "Cap. mercado", value: formatCompact(selected.market_cap, vs) },
            { label: "Volumen 24h", value: formatCompact(selected.total_volume, vs) },
          ].map((k) => (
            <div key={k.label} className="glass rounded-2xl p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{k.label}</p>
              <p className="text-lg md:text-xl font-bold text-foreground" style={k.tone ? { color: k.tone } : undefined}>
                {k.value}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="glass rounded-2xl p-4 md:p-6">
        <p className="font-bold text-foreground mb-3">
          {selected ? `${selected.name} · ${rangeLabel}` : "Gráfica"}
          {chartBusy && <span className="text-xs font-normal text-muted-foreground ml-2">actualizando…</span>}
        </p>
        {chart === null ? (
          <Skeleton className="h-[260px]" />
        ) : (
          <AreaChart
            data={chart}
            formatY={(v) => formatMoney(v, vs)}
            formatX={(t) => formatTime(t, days)}
            label={`Precio de ${selected?.name ?? "la moneda"} en rango ${rangeLabel}`}
          />
        )}
      </div>

      <div className="glass rounded-2xl p-4 md:p-6 overflow-x-auto">
        <p className="font-bold text-foreground mb-3">Top monitoreado · 7 días</p>
        {markets === null ? (
          <Skeleton className="h-48" />
        ) : (
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">Moneda</th>
                <th className="pb-2 pr-3 font-medium text-right">Precio</th>
                <th className="pb-2 pr-3 font-medium text-right">24h</th>
                <th className="pb-2 pr-3 font-medium">7d</th>
                <th className="pb-2 font-medium text-right hidden sm:table-cell">Cap.</th>
              </tr>
            </thead>
            <tbody>
              {markets.map((m) => {
                const up = m.price_change_percentage_24h >= 0
                return (
                  <tr key={m.id} className="border-t border-(--glass-border)">
                    <td className="py-2 pr-3">
                      <button
                        type="button"
                        onClick={() => pickCoin(m.id)}
                        className="font-medium text-foreground underline-offset-4 hover:underline min-h-[44px] touch-manipulation text-left"
                        aria-label={`Ver ${m.name}`}
                      >
                        {m.name} <span className="text-xs text-muted-foreground">{m.symbol.toUpperCase()}</span>
                      </button>
                    </td>
                    <td className="py-2 pr-3 text-right text-foreground">{formatMoney(m.current_price, vs)}</td>
                    <td
                      className="py-2 pr-3 text-right font-medium"
                      style={{ color: up ? "var(--module-dev)" : "var(--module-fotografia)" }}
                    >
                      {up ? "+" : ""}
                      {m.price_change_percentage_24h.toFixed(2)} %
                    </td>
                    <td className="py-2 pr-3">
                      <Sparkline prices={m.sparkline_in_7d.price} up={up} />
                    </td>
                    <td className="py-2 text-right text-muted-foreground hidden sm:table-cell">
                      {formatCompact(m.market_cap, vs)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Datos: CoinGecko API pública · Auto-refresh 60 s · Demo educativa, no es asesoría financiera. Desarrollado por
        José Andrés Dávila L. 2026. Licencia libre.
      </p>
    </div>
  )
}
