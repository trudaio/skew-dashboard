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

---

## Code Review Bugs Found and Fixed (2026-04-30)

These were caught in a full-project code review. All fixed in commit on `fix/data-accuracy`.

**Scanner was hardcoded to Jan 4, 2026.** `getNextMonthlyExpirations()` had `const today = new Date(2026, 0, 4)`. After January 2026, every "next monthly expiration" returned was already in the past. Polygon snapshot returned no useful data. **Fix: use `new Date()` real, not hardcoded.**

**TastyTrade IV Rank/Percentile/5DChange displayed at wrong scale.** API returns these as 0–1 fractions; some consumers multiplied ×100 (Dashboard `ivPercentile`, scanner `iv5DayChange`), others didn't (Dashboard `ivRank` showed "0%" for a real 0.45 rank). Scanner's `formatTastyValue` had `value.toFixed(1)*100` (string-then-multiply bug) and was missing the `%` sign. **Fix: scale ×100 ONCE inside `fetchMarketMetrics` so all consumers receive 0–100. Match thresholds (30/50) accordingly.**

**`fetchNextEarnings` queried a Polygon field that doesn't exist.** `/v3/reference/tickers/{ticker}` does NOT return `next_earnings_date`. Field was always `undefined`, so the "Next Earnings" banner never appeared. **Fix: use FMP `earning_calendar?from=today&to=+90d` and pick the first row matching the ticker.**

**Scanner had no 429 (rate-limit) handling.** `fetchOptionsForScanner` did `if (!res.ok) break` — silently produced zero results on rate-limit, no UI feedback. With 100 tickers × 8s delay, hitting a rate limit at least once is likely. **Fix: retry on 429 with exponential backoff (1s/2s/4s); propagate `error` field to UI; show ⚠ 429 indicator next to ticker.**

**`bestPut`/`bestCall` selection had no delta cap.** When a chain only had ITM contracts, the "best match" for 10Δ could be a 0.45-delta strike — skew calculated on these is meaningless. **Fix: reject best match if `|delta - target| > 0.05`.**

**`extractPremium` produced misleading mids on one-sided books.** `if (bid && ask) return (bid+ask)/2` — but for `bid=0, ask=0.05`, mid=0.025 even though there is no actual two-sided market. **Fix: require `bid > 0 && ask > 0` for the mid path.**

**Backtest `±$5` strike range broke for high-priced stocks.** NVDA/GOOGL/AMZN often > $500 — a $5 window around the BS-estimated strike found no contracts. **Fix: range = `Math.max(5, entryPrice * 0.02)`.**

**FMP `Promise.all` had no timeout.** If one of 6 endpoints hung, dashboard stayed "Loading..." forever. **Fix: `AbortSignal.timeout(10_000)` on all FMP fetches.**

---

## Remaining Known FMP Inaccuracies (not yet fixed)

**FMP free tier serves stale data for high-profile tickers.** Even after the market cap fix, some FMP fields (`q.pe`, `q.eps`, ratios) may lag behind reality by days or weeks for heavily-followed stocks like TSLA, NVDA, AAPL. This is an FMP tier limitation, not a code bug. Upgrading to FMP paid tier or switching to a different fundamentals API is the real fix.

**`LT Debt/Eq` uses debt-to-capitalization, not debt-to-equity.** `r.longTermDebtToCapitalizationTTM` = LT Debt / (LT Debt + Equity). Finviz shows LT Debt / Equity. FMP free tier doesn't expose `longTermDebtToEquityRatioTTM` directly in ratios-ttm. The numbers will differ (TSLA: 0.59 vs Finviz 0.15). Accepted for now.

**Beta from FMP profile may differ from Finviz.** Different calculation windows and benchmark periods. TSLA: app 0.77 vs Finviz 1.93. No code fix — FMP methodology differs from Finviz.

---

## Styling

**Don't create `.css` files.** All styles live in the `styles` template literal (~line 38). Add new rules inside the existing template literal.

**Class names are global strings.** There's no CSS Modules, Tailwind, or scoping. Check for conflicts before adding new class names.

---

## API / Data Fetching

**`VITE_FMP_API_KEY` controls fundamentals.** Listed in `.env.example`. App silently falls back to `buildBasicFundamentals` (calculated technicals only) when missing.

**Polygon.io `next_url` pagination.** `fetchOptions` and `fetchOptionsForScanner` loop `while (url)` following `next_url`. Don't break this loop — you'll silently miss deep-OTM options.

**Scanner delay (8s) is rate-limit protection.** Polygon.io free/starter plans cap requests per minute. Don't reduce the delay; upgrade the API plan if speed is needed.

**TastyTrade `fetchMarketMetrics` vs `fetchSingleMetric`.** Scanner batch-fetches all 100 tickers. Dashboard uses single-ticker fetch. Different endpoints, slightly different response shapes.

**TastyTrade token is cached on the singleton.** Constructing `new TastyTradeClient()` inside a component breaks caching and causes double-refresh on every call.

---

## Options Data

**Put deltas are negative in raw Polygon data.** `greeks.delta` for puts = e.g. `-0.10`. `processOptionsData` matches with `Math.abs(p.delta - putTarget)` where `putTarget = -d/100`. Don't negate again.

**`extractPremium` uses mid-price, not last.** Uses `(ask + bid) / 2` and **requires both bid and ask > 0** to avoid distorted mids on one-sided books. Don't use `day.last_price` for premium calculations.

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

**Backtest strike range scales with price.** Uses `Math.max(5, entryPrice * 0.02)`. For NVDA > $800, that becomes ±$16 — wide enough to find contracts. Don't revert to fixed ±$5.

**Null P&L ≠ loss.** `fetchOptionHistoricalPrice` returns `null` when option didn't trade that day. P&L is set to `null`, not 0.

---

## Deployment

**`npm run deploy` pushes to production immediately.** Run `npm run preview` first.

**Firebase 1-year cache headers.** Old clients won't see new JS/CSS until Vite changes the filename hash (automatic on rebuild).
