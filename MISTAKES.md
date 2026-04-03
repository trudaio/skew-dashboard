# MISTAKES — Common Pitfalls

Things that have caused bugs or wasted time in this codebase. Read before making changes.

---

## Styling

**Don't create `.css` files.** All styles live in the `styles` template literal (~line 38). Adding a separate file will work in dev but the styles won't be co-located with the components that use them, breaking the single-file pattern. Add new rules inside the existing template literal.

**Class names are global strings.** There's no CSS Modules, Tailwind, or scoping. A class like `.card` or `.btn` applies everywhere. Check for conflicts before adding new class names.

---

## API / Data Fetching

**`VITE_FMP_API_KEY` is not in `.env.example`.** If you're testing fundamentals and they look fake/empty, check that this key is in `.env`. The app silently falls back to `buildBasicFundamentals` (no real data).

**Polygon.io `next_url` pagination.** The options snapshot endpoint returns paginated results. `fetchOptions` and `fetchOptionsForScanner` both loop `while (url)` following `next_url`. Don't break this loop or you'll silently miss deep-OTM options.

**Scanner delay is rate-limit protection, not a UX choice.** The 8-second delay between scanner tickers exists because Polygon.io's free/starter plans cap requests per minute. Reducing it will cause 429 errors mid-scan. Increasing the API plan tier is the right fix if speed is needed.

**TastyTrade `fetchMarketMetrics` vs `fetchSingleMetric`.** Scanner batch-fetches all 100 tickers in one call. Dashboard uses `fetchSingleMetric`. They hit different TastyTrade endpoints and return slightly different shapes. Don't assume the return shape is identical.

**TastyTrade token is cached on the client instance.** `tastyTradeClient` is a module-level singleton. If you construct a new `TastyTradeClient()` inside a component, you'll break token caching and double-refresh on every call.

---

## Options Data

**Put deltas are negative in raw Polygon data.** `greeks.delta` for puts comes back as e.g. `-0.10`. `processOptionsData` matches them with `Math.abs(p.delta - putTarget)` where `putTarget = -d/100`. Don't accidentally negate again.

**`extractPremium` uses mid-price, not last.** It takes `(ask + bid) / 2`. Don't use `day.last_price` for premium calculations — spreads matter and last price can be stale.

**Monthly expiration detection is day-range based.** `isMonthlyExpiration` checks `dayOfMonth >= 15 && dayOfMonth <= 21 && dayOfWeek === 5`. This is the standard 3rd-Friday rule. Don't replace with a calendar library lookup — it would break the Scanner's `getNextMonthlyExpirations` function that generates dates ahead of time.

**`processOptionsData` silently drops malformed contracts.** Options missing `expiration_date`, `contract_type`, or `strike_price` are filtered out with a bare `return`. This is intentional dirty-data handling. Don't add logging here — it fires hundreds of times per load.

---

## React Patterns

**`fetchData` in DashboardTab is memoized with `[startDate, endDate]`.** `handleSelect` is memoized with `[fetchData]`. This means: if you change the date range and then click a ticker, you get the new date range. But changing the date range alone does NOT trigger a re-fetch. This is intentional — see TODO.

**Don't use `async` directly in `useEffect`.** The codebase uses `useCallback` for async operations. Using `async` in a `useEffect` body directly causes React warning noise and can cause stale closure issues.

**Scanner uses `abortRef.current` (not state) for cancellation.** Because the scan loop is async and doesn't re-render between iterations, `useState` wouldn't be read correctly mid-loop. `abortRef` is checked on each iteration. Don't replace with a state variable.

---

## Backtest

**Black-Scholes vol uses `HV * 1.1`.** The backtest estimates IV as historical vol plus 10% (`sigma = histVol * 1.1`). This is a rough approximation. Real IV is typically higher than HV but the multiplier is not calibrated. Don't treat backtest results as precise.

**Backtest fetches options by strike range `±5`.** `fetchOptionsContracts` passes `strikeGte = estimatedStrike - 5, strikeLte = estimatedStrike + 5`. For high-priced stocks (e.g., NVDA > $800), this range may miss the nearest available strike. The code has a fallback log but no retry logic.

**Historical option price fetch can return null.** If the option didn't trade on the entry date, `fetchOptionHistoricalPrice` returns `null`. The backtest handles this with `if (!putPrice)` checks, but downstream P&L is set to `null`, not 0. Don't treat `null` P&L as a loss.

---

## Deployment

**`npm run deploy` pushes to production immediately.** There is no staging environment. Run `npm run preview` to verify the build first.

**Firebase cache headers are 1 year for JS/CSS.** After deploying, users with cached builds won't see new JS/CSS until the filename hash changes (Vite handles this automatically on rebuild). If you manually rename a file, old clients keep the old version.
