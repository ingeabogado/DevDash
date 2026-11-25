// Cliente de la API pública de CoinGecko (sin key) para la demo DevDash.
export type VsCurrency = "usd" | "mxn" | "eur"

export interface MarketCoin {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  market_cap: number
  total_volume: number
  price_change_percentage_24h: number
  sparkline_in_7d: { price: number[] }
  last_updated: string
}

export interface ChartPoint {
  t: number
  p: number
}

export const COIN_IDS = ["bitcoin", "ethereum", "solana", "cardano", "dogecoin", "chainlink", "litecoin", "polkadot"]

const BASE = "https://api.coingecko.com/api/v3"

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" } })
  if (res.status === 429) throw new Error("Límite de la API pública alcanzado, reintenta en un minuto.")
  if (!res.ok) throw new Error(`La API pública respondió ${res.status}.`)
  return (await res.json()) as T
}

export function fetchMarkets(vs: VsCurrency): Promise<MarketCoin[]> {
  const params = new URLSearchParams({
    vs_currency: vs,
    ids: COIN_IDS.join(","),
    price_change_percentage: "24h",
    sparkline: "true",
  })
  return getJson<MarketCoin[]>(`${BASE}/coins/markets?${params}`)
}

export async function fetchChart(id: string, vs: VsCurrency, days: number): Promise<ChartPoint[]> {
  const params = new URLSearchParams({ vs_currency: vs, days: String(days) })
  const d = await getJson<{ prices: [number, number][] }>(`${BASE}/coins/${id}/market_chart?${params}`)
  return d.prices.map(([t, p]) => ({ t, p }))
}

const LOCALE = "es-MX"
const CURRENCY: Record<VsCurrency, string> = { usd: "USD", mxn: "MXN", eur: "EUR" }

export function formatMoney(v: number, vs: VsCurrency): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY[vs],
    maximumFractionDigits: v < 10 ? 4 : 2,
  }).format(v)
}

export function formatCompact(v: number, vs: VsCurrency): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY[vs],
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(v)
}

export function formatTime(t: number, days: number): string {
  const d = new Date(t)
  return days <= 1
    ? d.toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString(LOCALE, { day: "numeric", month: "short" })
}
