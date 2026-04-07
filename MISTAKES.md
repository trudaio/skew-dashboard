# MISTAKES — Common Pitfalls

Things that have caused bugs or wasted time in this codebase. Read before making changes.

---

## FMP Fundamentals — Bugs Found and Fixed (2026-04-07)

These were active bugs confirmed by comparing with Finviz live data for TSLA.

**`p.volAvg` is volume, not shares outstanding.** The original fallback `q.sharesOutstanding || p.volAvg` silently used average daily trading volume (~170M for TSLA) as shares outstanding instead of the real ~3.19B. This cascaded into completely wrong Income and Sales figures. **Fix: use `q.sharesOutstanding || 0` only.**

**FMP `q.marketCap` is often stale.** FMP caches market cap and it can lag days or weeks. TSLA showed $408B when the real value was $1,324B. **Fix: compute `liveMarketCap = stockPrice × shares` where `stockPrice` comes from Polygon (real-time).** Then derive Revenue from `liveMarketCap / P/S ratio` and Income from `q.eps × shares`.

**`financial-growth` without `period=quarter` returns annual YoY data.** The endpoint is used for Sales Q/Q and EPS Q/Q, but without `&period=quarter` it returns annual year-over-year data. For TSLA, this showed EPS Q/Q = +27.4% (annual YoY from a profitable year) when the actual Q/Q was -63.92%. **Fix: add a second fetch with `?limit=1&period=quarter` for Q/Q fields only.** Fall back to annual if the quarterly fetch fails.

**FMP profile `p.lastDiv` is non-zero for non-dividend stocks.** TSLA showed Dividend = $0.09 / 0.85% even though Tesla has never paid a dividend. FMP's profile endpoint returns a small historical artifact in `lastDiv`. **Fix: only display dividend when `p.lastDiv > 0.01`.**

**`EPS next 5Y` was mapped to `fiveYRevenueGrowthPerShare` (revenue, not EPS).** Wrong metric entirely — revenue growth displayed under an EPS label. FMP free tier has no forward EPS estimate endpoint. **Fix: show `-` for EPS next 5Y.**

**`ROI` was mapped to `returnOnCapitalEmployedTTM` (ROCE ≠ ROI).** ROCE and Finviz's ROI are different metrics. **Fix: try `m.roicTTM` (ROIC from key-metrics-ttm) first, fall back to ROCE.**

**`EPS next Y` and `EPS this Y` both map to `g.epsgrowth` (same field).** They are different concepts but currently identical. No better source in FMP free tier — accepted limitation for now.

---

## Remaining Known FMP Inaccuracies (not yet fixed)

**FMP free tier serves stale data for high-profile tickers.** Even after the market cap fix, some FMP fields (`q.pe`, `q.eps`, ratios) may lag behind reality by days or weeks for heavily-followed stocks like TSLA, NVDA, AAPL. This is an FMP tier limitation, not a code bug. Upgrading to FMP paid tier or switching to a different fundamentals API is the real fix.

**`LT Debt/Eq` uses debt-to-capitalization, not debt-to-equity.** `r.longTermDebtToCapitalizationTTM` = LT Debt / (LT Debt + Equity). Finviz shows LT Debt / Equity. FMP free tier doesn't expose `longTermDebtToEquityRatioTTM` directly in ratios-ttm. The numbers will differ (TSLA: 0.59 vs Finviz 0.15). Accepted for now.

**ATR calculation uses close-to-close differences, not true ATR.** `calculateATR` computes `|close[i] - close[i-1]|` averaged over 14 days. True ATR uses `max(high-low, |high-prev_close|, |low-prev_close|)`. Polygon price history returns only `close` and `volume` (no high/low), so true ATR is impossible with the current data source. Our ATR will always be lower than Finviz's ATR. To fix: fetch OHLC bars (`/v2/aggs/ticker/{ticker}/range/1/day/...` already done in `fetchPriceHistory` — but `high` field `r.h` is not mapped). See TODO.

**Beta from FMP profile may differ from Finviz.** Different calculation windows and benchmark periods. TSLA: app 0.77 vs Finviz 1.93. No code fix — FMP methodology differs from Finviz.

---

## Styling

**Don't create `.css` files.** All styles live in the `styles` template literal (~line 38). Add new rules inside the existing template literal.

**Class names are global strings.** There's no CSS Modules, Tailwind, or scoping. Check for conflicts before adding new class names.

---

## API / Data Fetching

**`VITE_FMP_API_KEY` is not in `.env.example`.** If fundamentals look empty, check this key is in `.env`. App silently falls back to `buildBasicFundamentals` when missing.

**Polygon.io `next_url` pagination.** `fetchOptions` and `fetchOptionsForScanner` loop `while (url)` following `next_url`. Don't break this loop — you'll silently miss deep-OTM options.

**Scanner delay (8s) is rate-limit protection.** Polygon.io free/starter plans cap requests per minute. Don't reduce the delay; upgrade the API plan if speed is needed.

**TastyTrade `fetchMarketMetrics` vs `fetchSingleMetric`.** Scanner batch-fetches all 100 tickers. Dashboard uses single-ticker fetch. Different endpoints, slightly different response shapes.

**TastyTrade token is cached on the singleton.** Constructing `new TastyTradeClient()` inside a component breaks caching and causes double-refresh on every call.

---

## Options Data

**Put deltas are negative in raw Polygon data.** `greeks.delta` for puts = e.g. `-0.10`. `processOptionsData` matches with `Math.abs(p.delta - putTarget)` where `putTarget = -d/100`. Don't negate again.

**`extractPremium` uses mid-price, not last.** Uses `(ask + bid) / 2`. Don't use `day.last_price` for premium calculations.

**Monthly expiration detection is day-range based.** `isMonthlyExpiration` checks `dayOfMonth >= 15 && dayOfMonth <= 21 && dayOfWeek === 5`. Don't replace with a calendar library — it would break `getNextMonthlyExpirations`.

**`processOptionsData` silently drops malformed contracts.** Bare `return` on missing fields is intentional dirty-data handling. Don't add logging here.

---

## React Patterns

**`fetchData` memoized with `[startDate, endDate]` — date changes don't auto-refresh.** Changing the date range requires clicking Refresh manually. Intentional; see TODO.

**Don't use `async` directly in `useEffect`.** Use `useCallback` for async operations.

**Scanner cancellation uses `abortRef.current`, not state.** `useState` wouldn't be read correctly mid-async-loop. Don't replace with state.

---

## Backtest

**Black-Scholes vol uses `HV * 1.1`.** Rough approximation; not calibrated. Don't treat results as precise.

**Backtest strike range `±5` misses high-priced stocks.** For NVDA > $800, the ±5 range around the estimated strike may find nothing. Code logs but doesn't retry.

**Null P&L ≠ loss.** `fetchOptionHistoricalPrice` returns `null` when option didn't trade that day. P&L is set to `null`, not 0.

---

## Deployment

**`npm run deploy` pushes to production immediately.** Run `npm run preview` first.

**Firebase 1-year cache headers.** Old clients won't see new JS/CSS until Vite changes the filename hash (automatic on rebuild).
