# TODO

Known issues and planned improvements for Skew Dashboard v14.

## Bugs

- [ ] **`.env.example` missing `VITE_FMP_API_KEY`** — New devs setting up won't know this key exists. Add it.
- [ ] **Scanner max date range silently truncated** — `maxEndDate` in DashboardTab caps at 6 months from startDate. If user selects a later end date it's silently clamped with no UI feedback.
- [ ] **TastyTrade refresh token rotation** — The refresh token itself can expire or be invalidated. There's no user-visible error state if token refresh fails (silently returns `null`, shows no TastyTrade data).
- [ ] **Backtest: "expiry not yet reached" shown as non-error** — When the target expiry is in the future, the log shows it as `info` but results show `null` P&L. Confusing UX.

## Missing Features

- [ ] **Rolling backtest** — Current backtest simulates a single trade entry. Real strategy evaluation needs multi-entry simulation (e.g., sell a new contract every Friday for 1 year).
- [ ] **`buildBasicFundamentals` is thin** — When `VITE_FMP_API_KEY` is missing, the fallback only produces RSI, ATR, HV, 52W range. No P/E, market cap, beta, or sector — half the FinViz table shows `-`.
- [ ] **No error boundaries** — A single failed fetch in DashboardTab sets `error` state and hides all data. ScannerTab's per-ticker errors are handled, but a crash in a chart component would blank the tab silently.
- [ ] **Scanner no persistence** — Scan results are lost on tab switch or page refresh. Could save to `localStorage`.
- [ ] **No loading skeleton for TickerSelector** — While data is fetching, the entire card is replaced with a spinner. The ticker grid flashes away.
- [ ] **Date range doesn't auto-refresh on change** — Changing start/end date in DashboardTab requires clicking "Refresh" manually. The `fetchData` callback depends on `[startDate, endDate]` but `handleSelect` is memoized; the date picker changes don't trigger a reload.

## Code Quality

- [ ] **App.jsx is ~3000 lines** — Workable but slow to navigate. Logical splits when the time comes: `api/`, `utils/`, `components/`, `tabs/`.
- [ ] **No TypeScript** — No static type checking. `processOptionsData` returns a complex nested object with no documented shape.
- [ ] **Global `apiClient` singleton** — Makes testing/mocking hard if tests are ever added. Consider exporting from a module.
- [ ] **`analyzeAndSuggestTrades` is long** — Does IV rank, performance calc, insights generation, and trade suggestions. Could be split.
- [ ] **Scanner `delay` state** — Stored in component state but also controls an async loop via closure. If user changes delay mid-scan, it only takes effect on the next iteration (correct behavior, but surprising).

## Performance

- [ ] **FMP fires 5 parallel requests per ticker load** — `Promise.all([quote, ratios, metrics, growth, profile])`. FMP free tier has a per-minute limit. Heavy dashboard use may hit this.
- [ ] **`processOptionsData` iterates full options list multiple times** — Once for allIVs/allOptions, once per expiration for delta matching. Fine at current scale but O(n*expirations*deltas).
- [ ] **No caching between tab switches** — Switching from Dashboard → Scanner → Dashboard re-fetches everything.
