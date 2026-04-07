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
- [ ] **ATR uses close-only (not true ATR)** — `calculateATR` uses `|close[i] - close[i-1]|`. True ATR needs high/low. `fetchPriceHistory` fetches from Polygon `/range/1/day/` which returns OHLC — but only `r.c` (close) and `r.v` (volume) are mapped. Fix: also map `r.h` (high) and `r.l` (low), then compute true ATR. TSLA: app 2.45 vs Finviz 14.83.
- [ ] **FMP free tier data is stale for some fields** — `q.pe`, `q.eps`, ratios-ttm may lag days/weeks for high-profile tickers. Not a code bug. Fix: upgrade to FMP paid tier or switch fundamentals provider.
- [ ] **`LT Debt/Eq` uses debt-to-capitalization, not debt-to-equity** — `r.longTermDebtToCapitalizationTTM` = LT Debt / (LT Debt + Equity) ≠ Finviz's LT Debt / Equity. FMP free tier doesn't expose the right field. TSLA: 0.59 vs Finviz 0.15.
- [ ] **`EPS next Y` and `EPS this Y` show same value** — Both use `g.epsgrowth` (annual). Different concepts, no better source in free tier.
- [ ] **Scanner max date range silently truncated** — `maxEndDate` caps at 6 months with no UI feedback to user.
- [ ] **TastyTrade refresh token expiry** — No user-visible error if refresh token is invalidated. Silently shows no TastyTrade data.
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
