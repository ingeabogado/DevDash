# DevDash — Dashboard cripto en vivo

Dashboard en **TypeScript + React + Tailwind**: precios cripto en vivo (CoinGecko),
filtros por moneda y rango, gráficas SVG propias y auto-refresh. Cero librerías de gráficas.

**Demo en vivo:** https://www.ingeabogado.com/dev/proyectos/devdash

**Repositorio:** https://github.com/ingeabogado/DevDash

## Qué problema resuelve (valor de mercado)

- Las PyMEs y despachos pagan paneles caros o viven en hojas de cálculo: DevDash
  demuestra que un dashboard en vivo cuesta una fracción y se adapta a cualquier
  API (ventas, inventario, cripto, clima).
- Los datos públicos ya existen gratis (precios, indicadores): esta demo los
  convierte en decisiones visibles (KPIs, tendencias, comparativas).
- Sirve como plantilla: cambia la fuente de datos y tienes el panel de tu negocio.

## Lo que hace

- 8 criptomonedas, 3 divisas (USD/MXN/EUR), 3 rangos (24H/7D/30D).
- KPIs: precio, cambio 24h, capitalización y volumen.
- Gráfica de área SVG con crosshair, tooltip y rejilla (código propio).
- Tabla con sparklines de 7 días; clic en una moneda para enfocarla.
- Auto-refresh cada 60 s (pausado si la pestaña está oculta), hora de actualización,
  reintento ante errores y datos retenidos si la API falla.
- Responsive móvil→escritorio, targets táctiles ≥44px, gráfica con `role="img"` y etiquetas.

## Lo que demuestra (empleadores y clientes)

| Señal que buscan | Dónde verla |
|---|---|
| Piensa en producción, no en juguetes | Estados de carga, error, vacío y reintento (`DevDash.tsx`) |
| Cuida el bundle | SVG propio en vez de una librería de gráficas (~100 KB ahorrados) |
| TypeScript estricto | `strict` + `noUnusedLocals`, tipos para cada respuesta de la API (`api.ts`) |
| Consume APIs reales con límites | Manejo de 429, `Intl` para moneda/fecha es-MX |
| Accesibilidad y responsive reales | `aria-pressed`, `role="img"`, tabla adaptativa, 44px táctiles |
| Código legible y separado | Cliente API, gráfica y vista en módulos independientes |

## Cómo correrlo

```bash
bun install
bun run dev      # desarrollo en http://localhost:5173
bun run build    # revisa tipos (tsc) y genera dist/
bun run preview  # sirve dist/ local
```

Con npm: `npm install`, `npm run dev`, `npm run build`.

## Estructura

```text
DevDash/
├── index.html            # entrada Vite
├── src/
│   ├── main.tsx          # bootstrap React
│   ├── App.tsx           # layout de la demo
│   ├── index.css         # tokens (Tailwind v4) + glass
│   └── devdash/
│       ├── api.ts        # cliente CoinGecko + formatos
│       ├── AreaChart.tsx # gráfica SVG con crosshair
│       └── DevDash.tsx   # vista: filtros, KPIs, tabla
├── Readme_DevDash.md
└── package.json
```

## Autor y licencia

Desarrollado por José Andrés Dávila L. 2026. Licencia MIT (ver `LICENSE`):
uso libre con atribución al autor.
