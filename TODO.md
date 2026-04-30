# TODO

Known issues and planned improvements for Skew Dashboard v14.

## Bugs

- [x] **~~`p.volAvg` used as shares outstanding fallback~~** — Fixed 2026-04-07. `p.volAvg` is trading volume, not shares. Caused wrong Income/Sales. Now uses `q.sharesOutstanding || 0`.
- [x] **~~Market Cap stale from FMP~~** — Fixed 2026-04-07. Now computed as `stockPrice (Polygon, live) × sharesOutstanding`. TSLA: $408B → ~$1,100B.
- [x] **~~Income and Sales wrong~~** — Fixed 2026-04-07. Income = `q.eps × shares`. Revenue = `liveMarketCap / P/S ratio`.
- [x] **~~Dividend shown for non-dividend stocks (TSLA)~~** — Fixed 2026-04-07. Added `p.lastDiv > 0.01` threshold.
- [x] **~~Sales Q/Q and EPS Q/Q used annual data~~** — Fixed 2026-04-07. Added separate quarterly growth fetch (`period=quarter`). TSLA EPS Q/Q: +27.4% → real -63.92%.
- [x] **~~EPS next 5Y mapped to revenue growth~~** — Fixed 2026-04-07. Now shows `-` (no reliable source in FMP free tier).
- [x] **~~ROI mapped to ROCE~~** — Fixed 2026-04-07. Now tries `m.roicTTM` (ROIC) first.

- [ ] **`.env.example` missing `VITE_FMP_API_KEY`** — New devs won't know this key exists. Add it.
- [x] **~~ATR uses close-only (not true ATR)~~** — Fixed 2026-04-30. `fetchPriceHistory` now maps `r.h` (high) and `r.l` (low). `calculateATR` uses true ATR formula: `max(high-low, |high-prevClose|, |low-prevClose|)`.
- [x] **~~FMP free tier data is stale for some fields~~** — Mitigated 2026-04-30. Affected fields (`LT Debt/Eq†`, `EPS next Y†`, `EPS this Y†`) now marked with `†` and a footnote: "Approximate — FMP free tier limitation". Underlying data source unchanged.
- [x] **~~`LT Debt/Eq` uses debt-to-capitalization, not debt-to-equity~~** — Mitigated 2026-04-30. Labelled as `LT Debt/Eq†` with footnote. Metric unchanged (FMP free tier limitation).
- [x] **~~`EPS next Y` and `EPS this Y` show same value~~** — Mitigated 2026-04-30. Both labelled with `†` footnote. No better source in free tier.
- [ ] **Scanner max date range silently truncated** — `maxEndDate` caps at 6 months with no UI feedback to user.
- [x] **~~TastyTrade refresh token expiry~~** — Fixed 2026-04-30. `TastyTradeClient` now tracks `authError`. Dashboard shows a red banner when token refresh fails: "TastyTrade session expired — IV Rank/Percentile unavailable".
- [ ] **Backtest: "expiry not yet reached" shows as `info` not warning** — When target expiry is in the future, result is `null` P&L with no clear explanation.

## Missing Features

- [ ] **Rolling backtest** — Single trade entry only. Real strategy evaluation needs multi-entry simulation (sell every Friday for 1 year).
- [ ] **`buildBasicFundamentals` fallback is thin** — When no FMP key: only RSI, ATR, HV, 52W range. No P/E, market cap, beta. Half the table shows `-`.
- [ ] **No error boundaries** — Crash in a chart component would blank the tab silently.
- [ ] **Scanner results not persisted** — Lost on tab switch or refresh. `localStorage` would help.
- [ ] **Date range doesn't auto-refresh** — Changing dates requires manual Refresh click.
- [ ] **FMP now fires 6 parallel requests** (was 5) — Added quarterly growth fetch. FMP free tier: 250 req/day. Monitor if this becomes a problem with heavy use.

## Code Quality

- [ ] **App.jsx is ~3000 lines** — Logical splits when the time comes: `api/`, `utils/`, `components/`, `tabs/`.
- [ ] **No TypeScript** — `processOptionsData` returns complex nested object with no documented shape.
- [ ] **Global `apiClient` singleton** — Hard to test/mock. Consider module exports.
- [ ] **`analyzeAndSuggestTrades` is long** — IV rank + performance + insights + trades. Could split.

## Performance

- [ ] **No caching between tab switches** — Dashboard → Scanner → Dashboard re-fetches everything.
- [ ] **`processOptionsData` multi-pass** — Iterates options list once for allIVs, once per expiration × delta. Fine at current scale.
