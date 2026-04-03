# Skew Dashboard

A real-time options skew visualization and analysis tool for equity tickers, with TastyTrade integration for live trading data.

## Features

- **Options Skew Charts** — Plot implied volatility skew curves across strikes for any ticker at multiple delta levels (10, 20, 30, 40 delta)
- **Multi-ticker Watchlist** — Monitor 100+ tickers simultaneously with auto-refresh
- **TastyTrade Integration** — Pull live options chain data via TastyTrade OAuth
- **Dashboard & Table Views** — Toggle between chart and tabular data views
- **Skew Distance Analysis** — Measure skew at 1%, 5%, and 10% OTM distances
- **Dark Theme UI** — Optimized for extended trading sessions

## Tech Stack

- React 18 + Vite
- Recharts for data visualization
- Lucide React icons
- Firebase Hosting

## Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/trudaio/skew-dashboard.git
   cd skew-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```
   Required variables:
   - `VITE_API_KEY` — Market data API key
   - `VITE_TASTYTRADE_CLIENT_ID` — TastyTrade OAuth client ID
   - `VITE_TASTYTRADE_CLIENT_SECRET` — TastyTrade OAuth client secret
   - `VITE_TASTYTRADE_REFRESH_TOKEN` — TastyTrade refresh token

4. Start the dev server:
   ```bash
   npm run dev
   ```

## Deployment

Deploy to Firebase Hosting:
```bash
npm run deploy
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run deploy` | Build and deploy to Firebase |
