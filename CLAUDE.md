# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Skew Dashboard v14 — a single-page options skew visualization and analysis tool. Plots implied volatility skew across strikes for 100+ equity tickers at 4 delta levels (10/20/30/40Δ), with TastyTrade IV metrics, a multi-ticker scanner, and a single-trade historical backtest.

## Commands

```bash
npm run dev        # Start local dev server (Vite, default port 5173)
npm run build      # Production build to dist/
npm run preview    # Preview production build locally
npm run deploy     # Build + deploy to Firebase Hosting (dist/ → Firebase)
```

No test suite exists. No linter configured.

## Architecture — The One-File Pattern

**All application code lives in `src/App.jsx` (~3000 lines).** There are no separate component files, hooks, services, or CSS files. This is intentional. Do not split it without explicit instruction.

Inline styles are injected as a single JS template literal (`const styles = \`...\``) at lines ~38–278, which is rendered via `<style>{styles}</style>` in the App component. **Do not create `.css` files** — add new styles to the `styles` template literal.

### Internal structure of App.jsx

| Lines | Section |
|-------|---------|
| 1–35 | Config: env vars, `DEFAULT_TICKERS` (100 symbols), `DELTAS`, colors |
| 38–278 | All CSS as a template literal |
| 280–600 | Math: Black-Scholes (`bsDelta`, `normalCDF`), RSI, ATR, IV rank, max pain, expected move, P/C ratio |
| 602–775 | Fundamentals: `fetchFMPFundamentals` (FMP API), `buildBasicFundamentals` (fallback) |
| 778–902 | `APIClient` class — Polygon.io REST calls |
| 904–1002 | `TastyTradeClient` class — OAuth refresh + market metrics |
| 1003–1248 | Data processors: `processOptionsData`, `formatChartData`, `processScannerData`, `analyzeAndSuggestTrades` |
| 1250–2069 | Leaf React components (DatePicker, TickerSelector, charts, tables) |
| 2070–2347 | `ScannerTab` component |
| 2349–2461 | `DashboardTab` component |
| 2463–2912 | `BacktestTab` component |
| 2913–2972 | Root `App` component (tab switcher only) |

### Global singletons (module-level)

```js
const apiClient = new APIClient()         // line ~902
const tastyTradeClient = new TastyTradeClient()  // instantiated in scanner/dashboard
```

There is no React Context, Redux, or shared state between tabs. Each tab is fully self-contained with local `useState`.

## Environment Variables

Required in `.env` (copy from `.env.example`):
```
VITE_API_KEY=              # Polygon.io — options chains, price history, earnings
VITE_FMP_API_KEY=          # Financial Modeling Prep — fundamentals (P/E, EV, ratios)
VITE_TASTYTRADE_CLIENT_ID=
VITE_TASTYTRADE_CLIENT_SECRET=
VITE_TASTYTRADE_REFRESH_TOKEN=  # Long-lived; obtain separately from TastyTrade OAuth
```

**Note:** `.env.example` is currently missing `VITE_FMP_API_KEY`. If omitted, `fetchFMPFundamentals` returns `null` and the app falls back to `buildBasicFundamentals` (calculated technicals only — no P/E, market cap, etc.).

TastyTrade access tokens expire after 15 minutes. The client caches them and refreshes at 14 minutes (`this.tokenExpiry = Date.now() + 14 * 60 * 1000`).

## Key Data Flows

### Dashboard Tab (`fetchData` in DashboardTab)
1. Parallel fetch: Polygon options snapshot, stock price, 365-day price history, earnings, next earnings, TastyTrade single-ticker metrics
2. Sequential: `fetchFMPFundamentals` → fallback to `buildBasicFundamentals`
3. Process: `processOptionsData` → `formatChartData` → `calculateTotalPCRatio` → `analyzeAndSuggestTrades`
4. Date range: today → today+90 days by default; max capped at 6 months from start date

### Scanner Tab (`startScan` in ScannerTab)
1. Batch-fetch TastyTrade metrics for all 100 tickers first
2. Sequentially iterate `DEFAULT_TICKERS` with configurable delay (default **8 seconds**) — Polygon.io rate limit constraint
3. Cancel mid-scan via `abortRef.current = true`
4. Scanner only fetches monthly expirations (3rd Fridays), not all expirations

### Backtest Tab
1. Fetch 365-day price history to find entry date
2. Estimate historical vol (30-day) → multiply by 1.1 to approximate IV
3. Binary search (50 iterations) to find strike at target delta via Black-Scholes
4. Fetch actual Polygon.io option contracts near estimated strike
5. Fetch historical option price on entry date and stock price at expiry
6. Single-trade backtest only — not a rolling/multi-entry simulation

## Domain Concepts

- **Skew**: Put IV minus Call IV at the same delta. Positive = puts more expensive (fear/hedging).
- **Premium skew %**: `(putPremium - callPremium) / callPremium * 100` — shown in main chart
- **Delta levels**: 10Δ, 20Δ, 30Δ, 40Δ. Put deltas are negative in raw data; `processOptionsData` matches by `Math.abs(delta - target)`.
- **Monthly expiration**: 3rd Friday of each month. `isMonthlyExpiration()` checks if day is Friday AND day-of-month is 15–21.
- **Distance analysis**: IV at fixed % OTM strikes (1%, 5%, 10%) — separate from delta-based analysis.
- **IV Rank**: `(currentIV - 52wLow) / (52wHigh - 52wLow) * 100` — calculated from all IVs in the options chain snapshot.
- **Max pain**: Strike price where aggregate option losses (puts + calls) for holders are maximized.
- **Expected move**: Derived from ATM straddle premium for the nearest monthly expiration.
- **`extractPremium`**: Uses mid-price `(ask + bid) / 2`. Falls back to mark or last if bid/ask unavailable.

## Deployment

Firebase Hosting serves `dist/` as SPA (all routes → `index.html`). Static assets (JS/CSS) get 1-year `Cache-Control` headers. `npm run deploy` runs `vite build && firebase deploy --only hosting`.
