import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, AreaChart, Area, ComposedChart, Bar, ScatterChart, Scatter, Cell } from 'recharts'
import { RefreshCw, TrendingUp, TrendingDown, Activity, AlertTriangle, Info, ChevronDown, ChevronUp, Loader2, Calendar, DollarSign, BarChart3, Target, Plus, X, ArrowUp, ArrowDown, Minus, Play, Pause, LayoutDashboard, Table2 } from 'lucide-react'

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_KEY = import.meta.env.VITE_API_KEY
const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY

// TastyTrade OAuth Credentials
const TASTYTRADE_CLIENT_ID = import.meta.env.VITE_TASTYTRADE_CLIENT_ID
const TASTYTRADE_CLIENT_SECRET = import.meta.env.VITE_TASTYTRADE_CLIENT_SECRET
const TASTYTRADE_REFRESH_TOKEN = import.meta.env.VITE_TASTYTRADE_REFRESH_TOKEN

const DEFAULT_TICKERS = [
  'SPY', 'QQQ', 'IWM', 'GLD', 'SLV', 'DIA', 'VTI', 'VOO', 'EEM', 'XLF',
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B', 'UNH', 'JNJ',
  'JPM', 'V', 'XOM', 'PG', 'MA', 'HD', 'CVX', 'MRK', 'ABBV', 'LLY',
  'PEP', 'KO', 'COST', 'AVGO', 'WMT', 'MCD', 'CSCO', 'ACN', 'TMO', 'ABT',
  'DHR', 'NEE', 'VZ', 'ADBE', 'CRM', 'NKE', 'TXN', 'PM', 'RTX', 'HON',
  'CMCSA', 'ORCL', 'IBM', 'AMGN', 'UPS', 'INTC', 'QCOM', 'LOW', 'MS', 'GS',
  'CAT', 'DE', 'BA', 'GE', 'ISRG', 'SPGI', 'BLK', 'INTU', 'AMD', 'AMAT',
  'MDLZ', 'ADP', 'GILD', 'BKNG', 'ADI', 'TJX', 'SBUX', 'MMC', 'SYK', 'REGN',
  'VRTX', 'LRCX', 'CI', 'CB', 'MO', 'ZTS', 'BDX', 'SO', 'DUK', 'PLD',
  'CME', 'CL', 'EQIX', 'ITW', 'SCHW', 'EOG', 'SLB', 'ATVI', 'PYPL', 'NOW'
]

const DELTAS = [10, 20, 30, 40]
const COLORS = { 10: '#3b82f6', 20: '#8b5cf6', 30: '#06b6d4', 40: '#f59e0b' }
const DISTANCE_PERCENTS = [1, 5, 10]

// ============================================================================
// STYLES
// ============================================================================

const styles = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0f; color: #f0f0f5; min-height: 100vh; }
  .container { max-width: 1600px; margin: 0 auto; padding: 0 20px; }
  
  .header { background: linear-gradient(180deg, #12121a 0%, #0a0a0f 100%); border-bottom: 1px solid #2a2a3a; padding: 20px 0; }
  .header-inner { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
  .header h1 { font-size: 24px; font-weight: 700; background: linear-gradient(135deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .header p { font-size: 14px; color: #606070; margin-top: 4px; }
  .header-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  
  .tabs { display: flex; gap: 4px; background: #12121a; padding: 4px; border-radius: 10px; border: 1px solid #2a2a3a; }
  .tab-btn { padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; background: transparent; color: #606070; }
  .tab-btn:hover { color: #a0a0b0; background: #1a1a24; }
  .tab-btn.active { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: #fff; }
  
  .date-picker { display: flex; align-items: center; gap: 8px; background: #12121a; border: 1px solid #2a2a3a; border-radius: 8px; padding: 8px 12px; }
  .date-picker input { background: transparent; border: none; color: #f0f0f5; font-size: 14px; font-family: monospace; width: 110px; outline: none; }
  .date-picker input::-webkit-calendar-picker-indicator { filter: invert(1); }
  .date-picker span { color: #606070; }
  
  .main { padding: 24px 0; }
  .section { margin-bottom: 24px; }
  
  .card { background: #12121a; border: 1px solid #2a2a3a; border-radius: 12px; padding: 16px; }
  .card-title { font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
  
  .ticker-section { margin-bottom: 12px; }
  .ticker-section-title { font-size: 11px; color: #606070; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
  .ticker-grid { display: flex; flex-wrap: wrap; gap: 5px; }
  .ticker-btn { padding: 5px 8px; border-radius: 5px; font-size: 10px; font-family: monospace; font-weight: 600; border: 1px solid #2a2a3a; background: #1a1a24; color: #a0a0b0; cursor: pointer; transition: all 0.2s; }
  .ticker-btn:hover { border-color: #3b82f6; color: #f0f0f5; }
  .ticker-btn.active { background: rgba(59, 130, 246, 0.2); border-color: #3b82f6; color: #3b82f6; }
  .ticker-btn.etf { border-color: #f59e0b40; }
  .ticker-btn.etf.active { background: rgba(245, 158, 11, 0.2); border-color: #f59e0b; color: #f59e0b; }
  .ticker-btn.custom { border-color: #22c55e40; }
  .ticker-btn.custom.active { background: rgba(34, 197, 94, 0.2); border-color: #22c55e; color: #22c55e; }
  .ticker-btn.loading { opacity: 0.5; pointer-events: none; }
  
  .custom-ticker-input { display: flex; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #2a2a3a; }
  .custom-ticker-input input { flex: 1; background: #0a0a0f; border: 1px solid #2a2a3a; border-radius: 6px; padding: 8px 12px; font-size: 13px; font-family: monospace; color: #f0f0f5; text-transform: uppercase; }
  .custom-ticker-input input::placeholder { color: #606070; text-transform: none; }
  .custom-ticker-input input:focus { outline: none; border-color: #22c55e; }
  .custom-ticker-input button { padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; border: none; cursor: pointer; display: flex; align-items: center; gap: 4px; background: #22c55e; color: #000; }
  .custom-ticker-input button:hover { background: #16a34a; }
  
  .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s; }
  .btn-primary { background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3); }
  .btn-primary:hover:not(:disabled) { transform: translateY(-1px); }
  .btn-danger { background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; }
  .btn:disabled { background: #1a1a24; color: #606070; cursor: not-allowed; box-shadow: none; }
  
  .loading { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 48px; color: #a0a0b0; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spin { animation: spin 1s linear infinite; }
  
  .summary-box { background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1)); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 10px; padding: 16px; margin-bottom: 16px; }
  .summary-title { font-size: 13px; font-weight: 600; color: #3b82f6; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
  .summary-text { font-size: 13px; color: #f0f0f5; line-height: 1.6; }
  .summary-text .highlight { color: #f59e0b; font-weight: 600; }
  .summary-text .bullish { color: #22c55e; font-weight: 600; }
  .summary-text .bearish { color: #ef4444; font-weight: 600; }
  
  .chart-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 16px; }
  .chart-title { font-size: 16px; font-weight: 600; }
  .chart-title .ticker { color: #3b82f6; font-family: monospace; }
  .exp-legend { display: flex; gap: 12px; margin-top: 8px; font-size: 11px; flex-wrap: wrap; }
  .exp-legend-item { display: flex; align-items: center; gap: 4px; }
  .exp-dot { width: 8px; height: 8px; border-radius: 50%; }
  .exp-dot.monthly { background: #f59e0b; }
  .exp-dot.weekly { background: #606070; }
  
  .chart-explanation { background: #0a0a0f; border: 1px solid #2a2a3a; border-radius: 8px; padding: 12px; margin-top: 12px; font-size: 12px; color: #a0a0b0; }
  .chart-explanation strong { color: #f0f0f5; }
  .chart-explanation .bullish { color: #22c55e; }
  .chart-explanation .bearish { color: #ef4444; }
  
  .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; }
  @media (min-width: 768px) { .metrics-grid { grid-template-columns: repeat(4, 1fr); } }
  @media (min-width: 1024px) { .metrics-grid { grid-template-columns: repeat(7, 1fr); } }
  .metric-card { background: #0a0a0f; border: 1px solid #2a2a3a; border-radius: 10px; padding: 12px; text-align: center; }
  .metric-card.highlight { border-color: #3b82f6; background: rgba(59, 130, 246, 0.05); }
  .metric-card.wide { grid-column: span 2; }
  .metric-value { font-size: 20px; font-family: monospace; font-weight: 700; margin-bottom: 4px; }
  .metric-label { font-size: 10px; color: #606070; text-transform: uppercase; letter-spacing: 0.05em; }
  .metric-sub { font-size: 9px; color: #808090; margin-top: 4px; }
  .metric-explanation { font-size: 10px; color: #a0a0b0; margin-top: 8px; padding-top: 8px; border-top: 1px solid #2a2a3a; text-align: left; line-height: 1.4; }
  
  .pc-gauge-container { display: flex; flex-direction: column; align-items: center; padding: 8px; }
  .pc-gauge-svg { width: 100%; max-width: 120px; }
  .pc-gauge-value { font-size: 18px; font-family: monospace; font-weight: 700; margin-top: 4px; }
  .pc-gauge-label { font-size: 10px; color: #606070; text-transform: uppercase; }
  
  .insights-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
  .insights-header h3 { font-size: 15px; font-weight: 600; }
  .assessment { margin-left: auto; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; }
  .assessment.fear { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
  .assessment.bullish { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
  .assessment.neutral { background: #1a1a24; color: #a0a0b0; }
  .insights-list { display: flex; flex-direction: column; gap: 10px; }
  .insight { display: flex; gap: 12px; padding: 12px; border-radius: 10px; border: 1px solid; }
  .insight.warning { background: rgba(239, 68, 68, 0.08); border-color: rgba(239, 68, 68, 0.2); }
  .insight.info { background: rgba(59, 130, 246, 0.08); border-color: rgba(59, 130, 246, 0.2); }
  .insight.success { background: rgba(34, 197, 94, 0.08); border-color: rgba(34, 197, 94, 0.2); }
  .insight.neutral { background: #1a1a24; border-color: #2a2a3a; }
  .insight-text { font-size: 13px; color: #f0f0f5; line-height: 1.5; }
  
  .stats-section { margin-top: 20px; padding-top: 20px; border-top: 1px solid #2a2a3a; }
  .stats-title { font-size: 11px; color: #606070; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
  
  .finviz-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 12px; }
  .finviz-table td { padding: 8px 10px; border: 1px solid #2a2a3a; }
  .finviz-table td:nth-child(odd) { background: #1a1a24; color: #808090; width: 12%; }
  .finviz-table td:nth-child(even) { background: #0a0a0f; color: #f0f0f5; font-family: monospace; font-weight: 500; }
  .finviz-table td.positive { color: #22c55e; }
  .finviz-table td.negative { color: #ef4444; }
  
  .next-earnings { margin-top: 16px; padding: 12px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; display: flex; align-items: center; gap: 10px; }
  .next-earnings-icon { font-size: 20px; }
  .next-earnings-text { font-size: 13px; color: #f59e0b; font-weight: 600; }
  .next-earnings-date { font-size: 13px; color: #f0f0f5; font-family: monospace; }
  
  .valuation-box { margin-top: 16px; padding: 16px; border-radius: 10px; border: 2px solid; }
  .valuation-box.overvalued { background: rgba(239, 68, 68, 0.08); border-color: rgba(239, 68, 68, 0.3); }
  .valuation-box.undervalued { background: rgba(34, 197, 94, 0.08); border-color: rgba(34, 197, 94, 0.3); }
  .valuation-box.fair { background: rgba(245, 158, 11, 0.08); border-color: rgba(245, 158, 11, 0.3); }
  .valuation-title { font-size: 12px; font-weight: 600; margin-bottom: 8px; }
  .valuation-text { font-size: 13px; color: #a0a0b0; line-height: 1.5; }
  
  .table-toggle { width: 100%; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; background: transparent; border: none; color: #f0f0f5; font-size: 15px; font-weight: 500; cursor: pointer; border-radius: 8px; }
  .table-toggle:hover { background: #1a1a24; }
  .table-wrap { overflow-x: auto; }
  table { width: 100%; font-size: 11px; border-collapse: collapse; }
  thead { background: #1a1a24; color: #a0a0b0; }
  th { padding: 10px 6px; text-align: left; font-weight: 500; white-space: nowrap; font-size: 10px; }
  th.right { text-align: right; }
  th.center { text-align: center; }
  th.put-header { background: rgba(239, 68, 68, 0.1); border-bottom: 3px solid #ef4444; }
  th.call-header { background: rgba(34, 197, 94, 0.1); border-bottom: 3px solid #22c55e; }
  th.border-left { border-left: 3px solid #404050; }
  th.sortable { cursor: pointer; user-select: none; }
  th.sortable:hover { background: #2a2a3a; }
  tbody { font-family: monospace; font-size: 10px; }
  tbody tr { border-top: 1px solid #2a2a3a; }
  tbody tr:nth-child(odd) { background: #0a0a0f; }
  tbody tr:nth-child(even) { background: #12121a; }
  tbody tr.monthly { background: rgba(245, 158, 11, 0.15) !important; border-left: 4px solid #f59e0b; }
  td { padding: 6px; }
  td.right { text-align: right; }
  td.center { text-align: center; }
  td.border-left { border-left: 3px solid #404050; }
  .delta-badge { padding: 2px 5px; border-radius: 4px; font-size: 9px; font-weight: 600; }
  .pct-badge { padding: 2px 5px; border-radius: 4px; font-size: 9px; font-weight: 600; background: #2a2a3a; }
  .exp-badge { font-size: 8px; padding: 2px 5px; border-radius: 4px; margin-left: 4px; }
  .exp-badge.monthly { background: rgba(245, 158, 11, 0.3); color: #f59e0b; font-weight: 700; }
  .exp-badge.weekly { background: rgba(96, 96, 112, 0.2); color: #606070; }
  .pct-diff { font-size: 8px; color: #606070; }
  .pct-diff.negative { color: #ef4444; }
  .pct-diff.positive { color: #22c55e; }
  
  .delta-display { font-size: 12px; font-weight: 700; }
  .strike-display { font-size: 10px; color: #a0a0b0; }
  
  .formula-box { background: #0a0a0f; border: 1px solid #2a2a3a; border-radius: 6px; padding: 10px 12px; margin-bottom: 12px; font-size: 10px; color: #a0a0b0; }
  .formula-box code { background: #1a1a24; padding: 2px 6px; border-radius: 4px; color: #f59e0b; font-family: monospace; }
  
  .monthly-summary-box { background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05)); border: 2px solid rgba(245, 158, 11, 0.4); border-radius: 10px; padding: 16px; margin-bottom: 16px; }
  .monthly-summary-title { font-size: 13px; font-weight: 700; color: #f59e0b; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
  .monthly-summary-text { font-size: 12px; color: #f0f0f5; line-height: 1.6; }
  
  .bell-curve-container { margin-top: 20px; padding: 16px; background: #0a0a0f; border: 1px solid #2a2a3a; border-radius: 10px; }
  .bell-curve-title { font-size: 13px; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
  .bell-curve-legend { display: flex; gap: 16px; margin-top: 8px; font-size: 11px; }
  .bell-curve-legend-item { display: flex; align-items: center; gap: 6px; }
  .legend-line { width: 20px; height: 2px; }
  
  .monthly-metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 16px; }
  .monthly-metric { background: #0a0a0f; border: 1px solid #2a2a3a; border-radius: 8px; padding: 12px; text-align: center; }
  .monthly-metric-label { font-size: 11px; color: #f59e0b; font-weight: 600; margin-bottom: 8px; }
  .monthly-metric-value { font-size: 18px; font-family: monospace; font-weight: 700; }
  
  footer { border-top: 1px solid #2a2a3a; margin-top: 48px; padding: 24px 0; text-align: center; }
  footer p { font-size: 12px; color: #606070; margin: 4px 0; }
  
  .price-chart-container { margin-top: 16px; padding-top: 16px; border-top: 1px solid #2a2a3a; }
  
  .volume-legend { display: flex; gap: 16px; margin-top: 8px; font-size: 11px; }
  .volume-legend-item { display: flex; align-items: center; gap: 4px; }
  .volume-box { width: 12px; height: 12px; border-radius: 2px; }
  .volume-box.put { background: rgba(239, 68, 68, 0.6); }
  .volume-box.call { background: rgba(34, 197, 94, 0.6); }
  
  /* Scanner Styles */
  .scanner-controls { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; padding: 16px; background: #12121a; border: 1px solid #2a2a3a; border-radius: 10px; }
  .scanner-control-group { display: flex; align-items: center; gap: 8px; }
  .scanner-control-group label { font-size: 12px; color: #a0a0b0; }
  .scanner-control-group input { background: #0a0a0f; border: 1px solid #2a2a3a; border-radius: 6px; padding: 8px 12px; font-size: 13px; color: #f0f0f5; outline: none; width: 60px; }
  .scanner-control-group input:focus { border-color: #3b82f6; }
  
  .scanner-status { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #a0a0b0; }
  .status-dot { width: 8px; height: 8px; border-radius: 50%; }
  .status-dot.running { background: #22c55e; animation: pulse 1s infinite; }
  .status-dot.stopped { background: #606070; }
  .status-dot.complete { background: #3b82f6; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  
  .progress-bar { flex: 1; min-width: 200px; }
  .progress-bar-bg { height: 8px; background: #2a2a3a; border-radius: 4px; overflow: hidden; }
  .progress-bar-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #8b5cf6); border-radius: 4px; transition: width 0.3s; }
  .progress-text { font-size: 11px; color: #606070; margin-top: 4px; }
  
  .scanner-table-container { max-height: 600px; overflow-y: auto; }
  .scanner-table .price-cell { color: #f0f0f5; }
  .scanner-table .skew-cell { font-weight: 600; }
  .scanner-table .skew-cell.positive { color: #ef4444; }
  .scanner-table .skew-cell.negative { color: #22c55e; }
  .scanner-table .skew-cell.neutral { color: #606070; }
  .scanner-empty { text-align: center; padding: 60px 20px; color: #606070; }

  .backtest-controls { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; padding: 16px; background: #12121a; border: 1px solid #2a2a3a; border-radius: 10px; }
  .backtest-control-group { display: flex; align-items: center; gap: 8px; }
  .backtest-control-group label { font-size: 12px; color: #a0a0b0; white-space: nowrap; }
  .backtest-control-group input, .backtest-control-group select { background: #0a0a0f; border: 1px solid #2a2a3a; border-radius: 6px; padding: 8px 12px; font-size: 13px; color: #f0f0f5; outline: none; }
  .backtest-control-group input:focus, .backtest-control-group select:focus { border-color: #3b82f6; }
  .backtest-control-group select { cursor: pointer; }

  .backtest-results { margin-top: 20px; }
  .backtest-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 20px; }
  .backtest-stat { background: #0a0a0f; border: 1px solid #2a2a3a; border-radius: 10px; padding: 16px; text-align: center; }
  .backtest-stat .value { font-size: 22px; font-family: monospace; font-weight: 700; margin-bottom: 4px; }
  .backtest-stat .label { font-size: 10px; color: #606070; text-transform: uppercase; letter-spacing: 0.05em; }
  .backtest-stat.profit .value { color: #22c55e; }
  .backtest-stat.loss .value { color: #ef4444; }
  .backtest-stat.neutral .value { color: #a0a0b0; }

  .backtest-log { background: #0a0a0f; border: 1px solid #2a2a3a; border-radius: 10px; padding: 16px; margin-top: 16px; max-height: 300px; overflow-y: auto; }
  .backtest-log-entry { font-size: 12px; font-family: monospace; color: #a0a0b0; padding: 4px 0; border-bottom: 1px solid #1a1a24; }
  .backtest-log-entry.success { color: #22c55e; }
  .backtest-log-entry.error { color: #ef4444; }
  .backtest-log-entry.info { color: #3b82f6; }
`

// ============================================================================
// BLACK-SCHOLES DELTA CALCULATOR (for historical backtest)
// ============================================================================

function normalCDF(x) {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911
  const sign = x < 0 ? -1 : 1
  x = Math.abs(x) / Math.sqrt(2)
  const t = 1.0 / (1.0 + p * x)
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
  return 0.5 * (1.0 + sign * y)
}

function bsDelta(S, K, T, sigma, r = 0.045, type = 'put') {
  if (T <= 0 || sigma <= 0) return type === 'put' ? -0.5 : 0.5
  const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T))
  return type === 'put' ? normalCDF(d1) - 1 : normalCDF(d1)
}

// Estimate historical vol from price history
function estimateHistoricalVol(priceHistory, days = 30) {
  if (!priceHistory || priceHistory.length < days + 1) return 0.25
  const recent = priceHistory.slice(-days - 1)
  const returns = []
  for (let i = 1; i < recent.length; i++) {
    returns.push(Math.log(recent[i].close / recent[i - 1].close))
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length
  const variance = returns.reduce((a, r) => a + (r - mean) ** 2, 0) / (returns.length - 1)
  return Math.sqrt(variance * 252)
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function isMonthlyExpiration(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  const dayOfWeek = date.getDay()
  const dayOfMonth = date.getDate()
  if (dayOfWeek !== 5) return false
  return dayOfMonth >= 15 && dayOfMonth <= 21
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatFullDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

// Calculate the 3rd Friday of a given month/year
function getThirdFriday(year, month) {
  // Start with the 1st of the month
  const firstDay = new Date(year, month, 1)
  const dayOfWeek = firstDay.getDay() // 0 = Sunday, 5 = Friday
  
  // Calculate first Friday
  // If 1st is Friday (5), first Friday is day 1
  // If 1st is Saturday (6), first Friday is day 7
  // If 1st is Sunday (0), first Friday is day 6
  // If 1st is Monday (1), first Friday is day 5
  // etc.
  let firstFridayDay
  if (dayOfWeek <= 5) {
    firstFridayDay = 1 + (5 - dayOfWeek)
  } else {
    // Saturday = 6, so next Friday is in 6 days
    firstFridayDay = 1 + (5 - dayOfWeek + 7)
  }
  
  // Third Friday is 14 days after first Friday
  const thirdFridayDay = firstFridayDay + 14
  
  return new Date(year, month, thirdFridayDay)
}

// Get the next 3 monthly expirations from today (using 2026)
function getNextMonthlyExpirations() {
  // Use 2026 as the base year
  const currentYear = 2026
  const currentMonth = 0 // January
  const today = new Date(2026, 0, 4) // January 4, 2026
  
  const expirations = []
  let year = currentYear
  let month = currentMonth
  
  for (let i = 0; i < 6 && expirations.length < 3; i++) {
    const thirdFriday = getThirdFriday(year, month)
    if (thirdFriday >= today) {
      // Format as YYYY-MM-DD
      const y = thirdFriday.getFullYear()
      const m = String(thirdFriday.getMonth() + 1).padStart(2, '0')
      const d = String(thirdFriday.getDate()).padStart(2, '0')
      expirations.push(`${y}-${m}-${d}`)
    }
    month++
    if (month > 11) { month = 0; year++ }
  }
  return expirations
}

function getMonthName(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })
}

function calculatePerformance(priceHistory, currentPrice) {
  if (!priceHistory || priceHistory.length === 0) return { ytd: null, qtd: null }
  const now = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const quarterMonth = Math.floor(now.getMonth() / 3) * 3
  const quarterStart = new Date(now.getFullYear(), quarterMonth, 1)
  let ytdPrice = null, qtdPrice = null
  for (const item of priceHistory) {
    const itemDate = new Date(item.date)
    if (!ytdPrice && itemDate >= yearStart) ytdPrice = item.close
    if (!qtdPrice && itemDate >= quarterStart) qtdPrice = item.close
  }
  return {
    ytd: ytdPrice ? ((currentPrice - ytdPrice) / ytdPrice * 100).toFixed(1) : null,
    qtd: qtdPrice ? ((currentPrice - qtdPrice) / qtdPrice * 100).toFixed(1) : null
  }
}

function extractPremium(opt) {
  if (opt.last_quote) {
    if (opt.last_quote.midpoint && opt.last_quote.midpoint > 0) return opt.last_quote.midpoint
    if (opt.last_quote.bid && opt.last_quote.ask) return (opt.last_quote.bid + opt.last_quote.ask) / 2
    if (opt.last_quote.ask && opt.last_quote.ask > 0) return opt.last_quote.ask
    if (opt.last_quote.bid && opt.last_quote.bid > 0) return opt.last_quote.bid
  }
  if (opt.day) {
    if (opt.day.close && opt.day.close > 0) return opt.day.close
    if (opt.day.vwap && opt.day.vwap > 0) return opt.day.vwap
    if (opt.day.open && opt.day.open > 0) return opt.day.open
    if (opt.day.high && opt.day.low) return (opt.day.high + opt.day.low) / 2
  }
  if (opt.last_trade && opt.last_trade.price > 0) return opt.last_trade.price
  return null
}

function calculateIVRank(allIVs) {
  if (!allIVs || allIVs.length < 2) return null
  const validIVs = allIVs.filter(iv => iv > 0)
  if (validIVs.length < 2) return null
  const min = Math.min(...validIVs)
  const max = Math.max(...validIVs)
  const current = validIVs[validIVs.length - 1]
  if (max === min) return 50
  return Math.round(((current - min) / (max - min)) * 100)
}

function calculateMaxPain(options, stockPrice) {
  if (!options || options.length === 0 || !stockPrice) return null
  const strikes = [...new Set(options.map(o => o.strike))].sort((a, b) => a - b)
  let minPain = Infinity
  let maxPainStrike = stockPrice
  for (const testStrike of strikes) {
    let totalPain = 0
    options.forEach(opt => {
      const oi = opt.openInterest || opt.volume || 1
      if (opt.type === 'call') {
        if (testStrike > opt.strike) totalPain += (testStrike - opt.strike) * oi * 100
      } else {
        if (testStrike < opt.strike) totalPain += (opt.strike - testStrike) * oi * 100
      }
    })
    if (totalPain < minPain) { minPain = totalPain; maxPainStrike = testStrike }
  }
  return maxPainStrike
}

function calculateExpectedMove(options, stockPrice) {
  if (!options || options.length === 0 || !stockPrice) return null
  let atmCall = null, atmPut = null
  let minCallDiff = Infinity, minPutDiff = Infinity
  options.forEach(opt => {
    const diff = Math.abs(opt.strike - stockPrice)
    if (opt.type === 'call' && diff < minCallDiff) { minCallDiff = diff; atmCall = opt }
    if (opt.type === 'put' && diff < minPutDiff) { minPutDiff = diff; atmPut = opt }
  })
  if (!atmCall || !atmPut) return null
  const straddle = (atmCall.premium || 0) + (atmPut.premium || 0)
  const expectedMove = straddle * 0.85
  const expectedMovePct = (expectedMove / stockPrice) * 100
  return { dollars: expectedMove.toFixed(2), percent: expectedMovePct.toFixed(1), upperBound: (stockPrice + expectedMove).toFixed(2), lowerBound: (stockPrice - expectedMove).toFixed(2) }
}

function calculateTotalPCRatio(allOptions) {
  if (!allOptions || allOptions.length === 0) return null
  const now = new Date()
  const sixtyDaysOut = new Date(now)
  sixtyDaysOut.setDate(sixtyDaysOut.getDate() + 60)
  let totalPutVolume = 0
  let totalCallVolume = 0
  allOptions.forEach(opt => {
    const expDate = new Date(opt.exp + 'T00:00:00')
    if (expDate <= sixtyDaysOut) {
      if (opt.type === 'put') totalPutVolume += (opt.volume || 0)
      else if (opt.type === 'call') totalCallVolume += (opt.volume || 0)
    }
  })
  if (totalCallVolume === 0) return null
  return { ratio: (totalPutVolume / totalCallVolume).toFixed(2), putVolume: totalPutVolume, callVolume: totalCallVolume }
}

function generateMonthlyOptionsSummary(chartData) {
  const monthlyData = chartData.filter(d => d.isMonthly)
  if (monthlyData.length === 0) return null
  
  const firstMonthly = monthlyData[0]
  const summaryParts = []
  
  const d10 = firstMonthly.d10_data
  if (d10) {
    const skewPct = d10.skewPct ? parseFloat(d10.skewPct) : 0
    const putVol = d10.putVolume || 0
    const callVol = d10.callVolume || 0
    const volRatio = callVol > 0 ? (putVol / callVol) : 0
    
    if (skewPct > 0) {
      summaryParts.push(`The <span class="bearish">10Δ put is ${Math.abs(skewPct).toFixed(1)}% more expensive</span> than calls`)
    } else if (skewPct < 0) {
      summaryParts.push(`The <span class="bullish">10Δ put is ${Math.abs(skewPct).toFixed(1)}% cheaper</span> than calls`)
    } else {
      summaryParts.push(`The 10Δ put and call are <span class="highlight">equally priced</span>`)
    }
    
    if (volRatio > 1.5) {
      summaryParts.push(`but <span class="bearish">put volume is ${volRatio.toFixed(1)}x higher</span>`)
    } else if (volRatio < 0.67) {
      summaryParts.push(`but <span class="bullish">call volume is ${(1/volRatio).toFixed(1)}x higher</span>`)
    }
  }
  
  const d20 = firstMonthly.d20_data
  if (d20) {
    const skewPct = d20.skewPct ? parseFloat(d20.skewPct) : 0
    const putVol = d20.putVolume || 0
    const callVol = d20.callVolume || 0
    const volRatio = callVol > 0 ? (callVol / putVol) : 0
    
    if (skewPct !== 0 || volRatio > 1.5) {
      let text = `The <span class="highlight">20Δ puts are ${Math.abs(skewPct).toFixed(1)}% ${skewPct > 0 ? 'more expensive' : 'cheaper'}</span> than calls`
      if (volRatio > 1.5) {
        text += `, but <span class="bullish">call volume is ${volRatio.toFixed(1)}x higher</span>`
      } else if (volRatio < 0.67) {
        text += `, and <span class="bearish">put volume is ${(1/volRatio).toFixed(1)}x higher</span>`
      }
      summaryParts.push(text)
    }
  }
  
  return summaryParts.length > 0 ? summaryParts.join('. ') + '.' : null
}

function generateMonthlySummary(chartData, ticker, stockPrice, pcRatio) {
  const monthlyData = chartData.filter(d => d.isMonthly)
  if (monthlyData.length === 0) return null
  const summaries = []
  const firstMonthly = monthlyData[0]
  const d10 = firstMonthly.d10_data
  const d20 = firstMonthly.d20_data
  
  // 10 Delta analysis
  if (d10) {
    const skewPct = d10.skewPct ? parseFloat(d10.skewPct) : 0
    if (skewPct > 20) {
      summaries.push(`The <span class="highlight">10Δ put is ${Math.abs(skewPct).toFixed(0)}% more expensive</span> than the equivalent call, indicating <span class="bearish">elevated downside hedging demand</span>.`)
    } else if (skewPct > 5) {
      summaries.push(`The <span class="highlight">10Δ put trades at a ${Math.abs(skewPct).toFixed(0)}% premium</span> to calls - moderate put skew suggesting normal hedging activity.`)
    } else if (skewPct < -10) {
      summaries.push(`<span class="bullish">Calls are ${Math.abs(skewPct).toFixed(0)}% more expensive</span> than puts at 10Δ, indicating bullish sentiment.`)
    } else {
      summaries.push(`Put and call premiums are <span class="highlight">roughly balanced</span> at the 10Δ level.`)
    }
  }
  
  // 20 Delta analysis
  if (d20) {
    const skewPct20 = d20.skewPct ? parseFloat(d20.skewPct) : 0
    const putVol20 = d20.putVolume || 0
    const callVol20 = d20.callVolume || 0
    
    if (skewPct20 > 15) {
      summaries.push(`The <span class="highlight">20Δ puts are ${Math.abs(skewPct20).toFixed(0)}% more expensive</span> than calls, and put volume is ${putVol20 > callVol20 ? ((putVol20/callVol20).toFixed(1) + 'x higher') : 'lower'}.`)
    } else if (skewPct20 > 5) {
      summaries.push(`The <span class="highlight">20Δ puts show ${Math.abs(skewPct20).toFixed(0)}% premium</span> over calls - moderate skew at closer-to-money strikes.`)
    } else if (skewPct20 < -5) {
      summaries.push(`<span class="bullish">20Δ calls are ${Math.abs(skewPct20).toFixed(0)}% more expensive</span> than puts, showing bullish positioning at closer strikes.`)
    }
  }
  
  // P/C Ratio analysis
  if (pcRatio) {
    const ratio = parseFloat(pcRatio.ratio)
    if (ratio > 1.2) {
      summaries.push(`<span class="bearish">Put volume is ${((ratio - 1) * 100).toFixed(0)}% higher</span> than call volume (P/C: ${pcRatio.ratio}).`)
    } else if (ratio < 0.8) {
      summaries.push(`<span class="bullish">Call volume is ${((1/ratio - 1) * 100).toFixed(0)}% higher</span> than put volume (P/C: ${pcRatio.ratio}).`)
    } else {
      summaries.push(`Volume is relatively balanced (P/C: ${pcRatio.ratio}).`)
    }
  }
  
  return summaries.join(' ')
}

function analyzePeterLynch(fundamentals) {
  if (!fundamentals) return null
  const peg = fundamentals.PEG ? parseFloat(fundamentals.PEG) : null
  let pegValuation = 'unknown', pegText = ''
  if (peg && peg > 0) {
    if (peg < 1) { pegValuation = 'undervalued'; pegText = `PEG ratio of ${peg.toFixed(2)} suggests undervaluation. Peter Lynch considers PEG < 1 a buy signal.` }
    else if (peg <= 2) { pegValuation = 'fair'; pegText = `PEG ratio of ${peg.toFixed(2)} indicates fair valuation.` }
    else { pegValuation = 'overvalued'; pegText = `PEG ratio of ${peg.toFixed(2)} suggests overvaluation.` }
  } else { pegText = 'Insufficient data for Peter Lynch PEG analysis.' }
  return { valuation: pegValuation, text: pegText, peg }
}

// ============================================================================
// FUNDAMENTALS DATA (FMP + CALCULATED FALLBACK)
// ============================================================================

function formatLargeNumber(num) {
  if (num == null || isNaN(num)) return '-'
  const abs = Math.abs(num)
  if (abs >= 1e12) return `$${(num / 1e12).toFixed(1)}T`
  if (abs >= 1e9) return `$${(num / 1e9).toFixed(0)}B`
  if (abs >= 1e6) return `$${(num / 1e6).toFixed(0)}M`
  return `$${num.toFixed(0)}`
}

function calculateRSI(prices, period = 14) {
  if (!prices || prices.length < period + 1) return null
  const closes = prices.slice(-(period + 1)).map(p => p.close)
  let gains = 0, losses = 0
  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff > 0) gains += diff; else losses -= diff
  }
  if (losses === 0) return '100.00'
  const rs = (gains / period) / (losses / period)
  return (100 - 100 / (1 + rs)).toFixed(2)
}

function calculateATR(prices, period = 14) {
  if (!prices || prices.length < period + 1) return null
  const recent = prices.slice(-(period + 1))
  let atrSum = 0
  for (let i = 1; i < recent.length; i++) {
    const prevClose = recent[i - 1].close
    const high = recent[i].high ?? recent[i].close
    const low = recent[i].low ?? recent[i].close
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose))
    atrSum += tr
  }
  return (atrSum / period).toFixed(2)
}

function calculateVolatility(priceHistory) {
  if (!priceHistory || priceHistory.length < 21) return '-'
  const calcVol = (days) => {
    const slice = priceHistory.slice(-days)
    const returns = slice.slice(1).map((p, i) => Math.log(p.close / slice[i].close))
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length
    const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length
    return (Math.sqrt(variance * 252) * 100).toFixed(1)
  }
  return `${calcVol(5)}% ${calcVol(21)}%`
}

async function fetchFMPFundamentals(ticker, stockPrice, priceHistory) {
  if (!FMP_API_KEY) {
    console.log('No FMP API key set. Add VITE_FMP_API_KEY to .env for real fundamentals.')
    return null
  }
  const base = 'https://financialmodelingprep.com/api/v3'
  try {
    const [quoteRes, ratiosRes, metricsRes, growthRes, growthQRes, profileRes] = await Promise.all([
      fetch(`${base}/quote/${ticker}?apikey=${FMP_API_KEY}`),
      fetch(`${base}/ratios-ttm/${ticker}?apikey=${FMP_API_KEY}`),
      fetch(`${base}/key-metrics-ttm/${ticker}?apikey=${FMP_API_KEY}`),
      fetch(`${base}/financial-growth/${ticker}?limit=1&apikey=${FMP_API_KEY}`),
      fetch(`${base}/financial-growth/${ticker}?limit=1&period=quarter&apikey=${FMP_API_KEY}`),
      fetch(`${base}/profile/${ticker}?apikey=${FMP_API_KEY}`)
    ])
    const [quoteArr, ratiosArr, metricsArr, growthArr, profileArr] = await Promise.all([
      quoteRes.json(), ratiosRes.json(), metricsRes.json(), growthRes.json(), profileRes.json()
    ])
    // Quarterly growth fetch is non-critical — don't let it break the whole function
    const growthQArr = growthQRes.ok ? await growthQRes.json().catch(() => []) : []

    // Check for API errors
    if (quoteArr?.['Error Message'] || !quoteArr?.[0]) {
      console.log('FMP API error:', quoteArr?.['Error Message'] || 'No data returned')
      return null
    }

    const q = quoteArr?.[0] || {}
    const r = ratiosArr?.[0] || {}
    const m = metricsArr?.[0] || {}
    const g = growthArr?.[0] || {}
    const gq = growthQArr?.[0] || {}  // quarterly growth — for Q/Q metrics
    const p = profileArr?.[0] || {}
    const price = stockPrice || q.price || 0

    const fmt = (n, d = 2) => (n != null && !isNaN(n) && isFinite(n)) ? Number(n).toFixed(d) : '-'
    const fmtPct = (n, d = 1) => (n != null && !isNaN(n) && isFinite(n)) ? `${(Number(n) * 100).toFixed(d)}%` : '-'

    const rsi = calculateRSI(priceHistory)
    const atr = calculateATR(priceHistory)
    const volatility = calculateVolatility(priceHistory)

    // BUG FIX: p.volAvg is average daily VOLUME, not shares outstanding. Removed as fallback.
    const shares = q.sharesOutstanding || 0

    // BUG FIX: Use Polygon's live stockPrice × FMP shares for a fresh market cap.
    // FMP's q.marketCap is often stale (cached). stockPrice comes from Polygon (real-time).
    const liveMarketCap = (stockPrice && shares) ? stockPrice * shares : (q.marketCap || p.mktCap || 0)

    // BUG FIX: Income = EPS × shares (EPS from quote is fresher than key-metrics-ttm per share).
    // Revenue = liveMarketCap / P/S ratio (avoids the stale per-share × shares math).
    const netIncome = (q.eps != null && shares) ? q.eps * shares
                    : (m.netIncomePerShareTTM && shares ? m.netIncomePerShareTTM * shares : null)
    const revenue = (liveMarketCap && r.priceToSalesRatioTTM) ? liveMarketCap / r.priceToSalesRatioTTM
                  : (m.revenuePerShareTTM && shares ? m.revenuePerShareTTM * shares : null)

    const divYield = r.dividendYielPercentageTTM ?? r.dividendYieldPercentageTTM ?? r.dividendYielTTM ?? r.dividendYieldTTM
    // BUG FIX: FMP occasionally returns a tiny non-zero lastDiv for non-dividend stocks (e.g. TSLA).
    // Only display dividend info when lastDiv is meaningfully above zero.
    const hasDividend = p.lastDiv > 0.01

    return {
      'Index': p.exchangeShortName || q.exchange || '-',
      // BUG FIX: Use liveMarketCap (Polygon price × FMP shares) instead of stale FMP marketCap.
      'Market Cap': formatLargeNumber(liveMarketCap || q.marketCap || p.mktCap),
      'Income': formatLargeNumber(netIncome),
      'Sales': formatLargeNumber(revenue),
      'Book/sh': fmt(m.bookValuePerShareTTM),
      'Cash/sh': fmt(m.cashPerShareTTM),
      // BUG FIX: Only show dividend when stock actually pays one.
      'Dividend': hasDividend ? `$${Number(p.lastDiv).toFixed(2)}` : '-',
      'Dividend %': hasDividend ? (divYield != null ? `${(Number(divYield) * 100).toFixed(2)}%` : `${(p.lastDiv / price * 100).toFixed(2)}%`) : '-',
      'Beta': fmt(p.beta),
      'ATR': atr || '-',
      'Volatility': volatility,
      'P/E': fmt(q.pe || r.peRatioTTM),
      'Forward P/E': fmt(r.forwardPERatioTTM),
      'PEG': fmt(r.priceEarningsToGrowthRatioTTM),
      'P/S': fmt(r.priceToSalesRatioTTM),
      'P/B': fmt(r.priceToBookRatioTTM),
      'P/C': fmt(r.priceCashFlowRatioTTM),
      'P/FCF': fmt(r.priceToFreeCashFlowsRatioTTM),
      'Quick Ratio': fmt(r.quickRatioTTM),
      'Current Ratio': fmt(r.currentRatioTTM),
      'Debt/Eq': fmt(r.debtEquityRatioTTM),
      'LT Debt/Eq†': fmt(r.longTermDebtToCapitalizationTTM),
      'EPS (ttm)': fmt(q.eps),
      'EPS next Y†': g.epsgrowth != null ? fmtPct(g.epsgrowth, 0) : '-',
      'EPS next Q': '-',
      'EPS this Y†': g.epsgrowth != null ? fmtPct(g.epsgrowth, 0) : '-',
      // BUG FIX: Was using fiveYRevenueGrowthPerShare (REVENUE) mislabelled as EPS next 5Y.
      // No reliable forward 5Y EPS estimate in FMP free tier — show '-'.
      'EPS next 5Y': '-',
      'EPS past 5Y': g.fiveYNetIncomeGrowthPerShare != null ? fmtPct(g.fiveYNetIncomeGrowthPerShare, 0) : '-',
      // BUG FIX: Q/Q metrics now use quarterly financial-growth (period=quarter), not annual YoY.
      // Annual data had wrong sign and magnitude (TSLA: app showed +27.4% vs real -63.92%).
      'Sales Q/Q': gq.revenueGrowth != null ? fmtPct(gq.revenueGrowth, 1) : (g.revenueGrowth != null ? fmtPct(g.revenueGrowth, 1) : '-'),
      'EPS Q/Q': gq.epsgrowth != null ? fmtPct(gq.epsgrowth, 1) : (g.epsgrowth != null ? fmtPct(g.epsgrowth, 1) : '-'),
      'ROA': r.returnOnAssetsTTM != null ? fmtPct(r.returnOnAssetsTTM) : '-',
      'ROE': r.returnOnEquityTTM != null ? fmtPct(r.returnOnEquityTTM) : '-',
      // BUG FIX: Was using ROCE (returnOnCapitalEmployed). ROIC from key-metrics is closer to Finviz's ROI.
      'ROI': m.roicTTM != null ? fmtPct(m.roicTTM) : (r.returnOnCapitalEmployedTTM != null ? fmtPct(r.returnOnCapitalEmployedTTM) : '-'),
      'Insider Own': '-',
      'Shs Outstand': shares ? `${(shares / 1e6).toFixed(0)}M` : '-',
      'Shs Float': '-',
      'Short Float': '-',
      'Short Ratio': '-',
      'Target Price': q.analystTargetPrice ? `$${Number(q.analystTargetPrice).toFixed(2)}` : '-',
      '52W Range': q.yearLow && q.yearHigh ? `$${Number(q.yearLow).toFixed(2)} - $${Number(q.yearHigh).toFixed(2)}` : '-',
      '52W High': q.yearHigh && price ? `${((price - q.yearHigh) / q.yearHigh * 100).toFixed(2)}%` : '-',
      '52W Low': q.yearLow && price ? `${((price - q.yearLow) / q.yearLow * 100).toFixed(2)}%` : '-',
      'RSI (14)': rsi || '-',
      'Change': q.changesPercentage != null ? `${Number(q.changesPercentage).toFixed(2)}%` : '-',
    }
  } catch (e) {
    console.log('FMP fundamentals fetch failed:', e)
    return null
  }
}

function buildBasicFundamentals(stockPrice, priceHistory) {
  const price = stockPrice || 0
  const rsi = calculateRSI(priceHistory)
  const atr = calculateATR(priceHistory)
  const volatility = calculateVolatility(priceHistory)

  let yearHigh = null, yearLow = null
  if (priceHistory?.length > 0) {
    const closes = priceHistory.map(p => p.close)
    yearHigh = Math.max(...closes)
    yearLow = Math.min(...closes)
  }

  const result = {}
  const emptyFields = ['Index', 'Market Cap', 'Income', 'Sales', 'Book/sh', 'Cash/sh', 'Dividend', 'Dividend %', 'Beta',
    'P/E', 'Forward P/E', 'PEG', 'P/S', 'P/B', 'P/C', 'P/FCF', 'Quick Ratio', 'Current Ratio', 'Debt/Eq', 'LT Debt/Eq†',
    'EPS (ttm)', 'EPS next Y†', 'EPS next Q', 'EPS this Y†', 'EPS next 5Y', 'EPS past 5Y', 'Sales Q/Q', 'EPS Q/Q',
    'ROA', 'ROE', 'ROI', 'Insider Own', 'Shs Outstand', 'Shs Float', 'Short Float', 'Short Ratio', 'Target Price']
  emptyFields.forEach(f => result[f] = '-')

  result['ATR'] = atr || '-'
  result['Volatility'] = volatility
  result['RSI (14)'] = rsi || '-'
  result['52W Range'] = yearHigh && yearLow ? `$${yearLow.toFixed(2)} - $${yearHigh.toFixed(2)}` : '-'
  result['52W High'] = yearHigh && price ? `${((price - yearHigh) / yearHigh * 100).toFixed(2)}%` : '-'
  result['52W Low'] = yearLow && price ? `${((price - yearLow) / yearLow * 100).toFixed(2)}%` : '-'
  result['Change'] = priceHistory?.length >= 2 ? `${((priceHistory[priceHistory.length - 1].close - priceHistory[priceHistory.length - 2].close) / priceHistory[priceHistory.length - 2].close * 100).toFixed(2)}%` : '-'
  return result
}

// ============================================================================
// API CLIENT
// ============================================================================

class APIClient {
  constructor() {
    this.key = API_KEY
    this.base = 'https://api.polygon.io'
  }
  
  async fetchOptions(ticker, start, end) {
    let results = []
    let url = `${this.base}/v3/snapshot/options/${ticker}?expiration_date.gte=${start}&expiration_date.lte=${end}&limit=250&apiKey=${this.key}`
    while (url) {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`API Error: ${res.status}`)
      const data = await res.json()
      if (data.results) results = results.concat(data.results)
      url = data.next_url ? `${data.next_url}&apiKey=${this.key}` : null
    }
    return { results }
  }
  
  async fetchStockPrice(ticker) {
    const url = `${this.base}/v2/aggs/ticker/${ticker}/prev?apiKey=${this.key}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    return data.results?.[0]?.c || null
  }
  
  async fetchPriceHistory(ticker, days = 365) {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    const url = `${this.base}/v2/aggs/ticker/${ticker}/range/1/day/${start.toISOString().split('T')[0]}/${end.toISOString().split('T')[0]}?apiKey=${this.key}`
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    return (data.results || []).map(r => ({ date: new Date(r.t).toISOString().split('T')[0], close: r.c, high: r.h, low: r.l, volume: r.v }))
  }
  
  async fetchEarnings(ticker) {
    try {
      const url = `${this.base}/vX/reference/financials?ticker=${ticker}&limit=10&apiKey=${this.key}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        if (data.results && data.results.length > 0) {
          return data.results.map(r => ({ date: r.filing_date || r.period_of_report_date, quarter: r.fiscal_quarter, year: r.fiscal_year })).filter(r => r.date)
        }
      }
    } catch (e) { console.log('Earnings fetch failed:', e) }
    return []
  }
  
  async fetchNextEarnings(ticker) {
    try {
      const url = `${this.base}/v3/reference/tickers/${ticker}?apiKey=${this.key}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        return data.results?.next_earnings_date || null
      }
    } catch (e) { console.log('Next earnings fetch failed:', e) }
    return null
  }
  
  // Fetch options contracts reference (for backtest - find available strikes)
  async fetchOptionsContracts(ticker, expirationDate, contractType = 'put', strikeGte, strikeLte) {
    let results = []
    let url = `${this.base}/v3/reference/options/contracts?underlying_ticker=${ticker}&expiration_date=${expirationDate}&contract_type=${contractType}&limit=250&apiKey=${this.key}`
    if (strikeGte) url += `&strike_price.gte=${strikeGte}`
    if (strikeLte) url += `&strike_price.lte=${strikeLte}`
    while (url) {
      const res = await fetch(url)
      if (!res.ok) break
      const data = await res.json()
      if (data.results) results = results.concat(data.results)
      url = data.next_url ? `${data.next_url}&apiKey=${this.key}` : null
    }
    return results
  }

  // Fetch historical price for a specific option contract
  async fetchOptionHistoricalPrice(optionTicker, date) {
    const url = `${this.base}/v2/aggs/ticker/${optionTicker}/range/1/day/${date}/${date}?apiKey=${this.key}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    return data.results?.[0] || null
  }

  // Fetch stock price on a specific historical date
  async fetchStockPriceOnDate(ticker, date) {
    const url = `${this.base}/v2/aggs/ticker/${ticker}/range/1/day/${date}/${date}?apiKey=${this.key}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    return data.results?.[0]?.c || null
  }

  // Scanner: Fetch options for monthly expirations only
  async fetchOptionsForScanner(ticker, monthlyDates) {
    const price = await this.fetchStockPrice(ticker)
    if (!price) return { results: [], price: null }
    
    const startDate = monthlyDates[0]
    const endDate = monthlyDates[monthlyDates.length - 1]
    
    let results = []
    try {
      let url = `${this.base}/v3/snapshot/options/${ticker}?expiration_date.gte=${startDate}&expiration_date.lte=${endDate}&limit=250&apiKey=${this.key}`
      while (url) {
        const res = await fetch(url)
        if (!res.ok) break
        const data = await res.json()
        if (data.results) results = results.concat(data.results)
        url = data.next_url ? `${data.next_url}&apiKey=${this.key}` : null
      }
    } catch (e) {
      console.log(`Scanner: Failed to fetch ${ticker}:`, e)
    }
    
    return { results, price }
  }
}

const apiClient = new APIClient()

// ============================================================================
// TASTYTRADE API CLIENT
// ============================================================================

class TastyTradeClient {
  constructor() {
    this.baseUrl = 'https://api.tastytrade.com'
    this.accessToken = null
    this.tokenExpiry = null
    this.authError = null
  }
  
  async getAccessToken() {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }
    
    // Refresh the token
    try {
      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: TASTYTRADE_REFRESH_TOKEN,
          client_id: TASTYTRADE_CLIENT_ID,
          client_secret: TASTYTRADE_CLIENT_SECRET,
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('TastyTrade token refresh failed:', response.status, errorText)
        this.authError = `Token refresh failed (${response.status})`
        this.accessToken = null
        this.tokenExpiry = null
        return null
      }

      const data = await response.json()
      this.accessToken = data.access_token
      // Set expiry to 14 minutes (tokens last 15 min, refresh early)
      this.tokenExpiry = Date.now() + (14 * 60 * 1000)
      this.authError = null
      return this.accessToken
    } catch (e) {
      console.error('TastyTrade token refresh error:', e)
      this.authError = 'Connection failed — check credentials or network'
      this.accessToken = null
      this.tokenExpiry = null
      return null
    }
  }
  
  async fetchMarketMetrics(symbols) {
    const token = await this.getAccessToken()
    if (!token) return {}
    
    try {
      // TastyTrade accepts comma-separated symbols
      const symbolList = Array.isArray(symbols) ? symbols.join(',') : symbols
      const response = await fetch(`${this.baseUrl}/market-metrics?symbols=${encodeURIComponent(symbolList)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      })
      
      if (!response.ok) {
        console.error('TastyTrade market metrics failed:', response.status)
        return {}
      }
      
      const data = await response.json()
      const metrics = {}
      
      // Parse the response - TastyTrade returns items array
      if (data.data && data.data.items) {
        data.data.items.forEach(item => {
          metrics[item.symbol] = {
            ivRank: item['implied-volatility-index-rank'] ? parseFloat(item['implied-volatility-index-rank']) : null,
            ivPercentile: item['implied-volatility-percentile'] ? parseFloat(item['implied-volatility-percentile']) : null,
            iv5DayChange: item['implied-volatility-index-5-day-change'] ? parseFloat(item['implied-volatility-index-5-day-change']) : null,
            liquidityRank: item['liquidity-rank'] ? parseFloat(item['liquidity-rank']) : (item['liquidity-rating'] || null),
            ivIndex: item['implied-volatility-index'] ? parseFloat(item['implied-volatility-index']) : null,
          }
        })
      }
      
      return metrics
    } catch (e) {
      console.error('TastyTrade market metrics error:', e)
      return {}
    }
  }
  
  async fetchSingleMetric(symbol) {
    const metrics = await this.fetchMarketMetrics(symbol)
    return metrics[symbol] || null
  }
}

const tastyTradeClient = new TastyTradeClient()

// ============================================================================
// DATA PROCESSING
// ============================================================================

function processOptionsData(response, stockPrice) {
  const results = response?.results || []
  if (!results.length) return { expirations: {}, allOptions: [], allIVs: [] }

  const byExp = {}
  const allOptions = []
  const allIVs = []
  
  results.forEach(opt => {
    const { details = {}, greeks = {}, implied_volatility: iv, day, open_interest } = opt
    const { expiration_date: exp, contract_type: type, strike_price: strike } = details
    const { delta } = greeks
    const premium = extractPremium(opt)
    const volume = day?.volume || 0
    const oi = open_interest || 0
    
    if (iv) allIVs.push(iv)
    if (!exp || !type || strike === undefined) return
    if (!byExp[exp]) byExp[exp] = { puts: [], calls: [], isMonthly: isMonthlyExpiration(exp) }
    
    const record = { strike, delta, iv, premium, exp, type, volume, openInterest: oi }
    allOptions.push(record)
    if (type === 'put') byExp[exp].puts.push(record)
    else if (type === 'call') byExp[exp].calls.push(record)
  })

  const processed = {}
  Object.entries(byExp).forEach(([exp, { puts, calls, isMonthly }]) => {
    processed[exp] = { isMonthly, deltas: {}, byDistance: {}, allPuts: puts, allCalls: calls }
    
    const allOptsForExp = [...puts, ...calls]
    processed[exp].maxPain = calculateMaxPain(allOptsForExp, stockPrice)
    processed[exp].expectedMove = calculateExpectedMove(allOptsForExp, stockPrice)
    
    DELTAS.forEach(d => {
      const putTarget = -d / 100
      const callTarget = d / 100
      let bestPut = null, bestPutDiff = Infinity
      puts.forEach(p => { if (p.delta !== undefined && Math.abs(p.delta - putTarget) < bestPutDiff) { bestPutDiff = Math.abs(p.delta - putTarget); bestPut = p } })
      let bestCall = null, bestCallDiff = Infinity
      calls.forEach(c => { if (c.delta !== undefined && Math.abs(c.delta - callTarget) < bestCallDiff) { bestCallDiff = Math.abs(c.delta - callTarget); bestCall = c } })
      
      if (bestPut && bestCall) {
        const putDistance = stockPrice ? stockPrice - bestPut.strike : null
        const callDistance = stockPrice ? bestCall.strike - stockPrice : null
        const putPctFromStock = stockPrice ? ((bestPut.strike - stockPrice) / stockPrice * 100).toFixed(1) : null
        const callPctFromStock = stockPrice ? ((bestCall.strike - stockPrice) / stockPrice * 100).toFixed(1) : null
        const premiumSkew = (bestPut.premium !== null && bestCall.premium !== null) ? (bestPut.premium - bestCall.premium) : null
        const skewPct = (bestPut.premium && bestCall.premium && bestCall.premium > 0) ? ((bestPut.premium - bestCall.premium) / bestCall.premium * 100).toFixed(1) : null
        const imbalance = putDistance && callDistance ? (putDistance / callDistance).toFixed(2) : null
        const avgIV = (bestPut.iv && bestCall.iv) ? ((bestPut.iv + bestCall.iv) / 2 * 100).toFixed(1) : null
        
        processed[exp].deltas[d] = {
          putIV: bestPut.iv, callIV: bestCall.iv, avgIV,
          putStrike: bestPut.strike, callStrike: bestCall.strike,
          putPremium: bestPut.premium, callPremium: bestCall.premium,
          putDelta: bestPut.delta, callDelta: bestCall.delta,
          putVolume: bestPut.volume, callVolume: bestCall.volume,
          premiumSkew, skewPct, putPctFromStock, callPctFromStock,
          putDistance: putDistance?.toFixed(2), callDistance: callDistance?.toFixed(2),
          imbalance
        }
      }
    })
    
    if (stockPrice) {
      DISTANCE_PERCENTS.forEach(pct => {
        const putTargetStrike = stockPrice * (1 - pct / 100)
        const callTargetStrike = stockPrice * (1 + pct / 100)
        let bestPut = null, bestPutDiff = Infinity
        puts.forEach(p => { const diff = Math.abs(p.strike - putTargetStrike); if (diff < bestPutDiff) { bestPutDiff = diff; bestPut = p } })
        let bestCall = null, bestCallDiff = Infinity
        calls.forEach(c => { const diff = Math.abs(c.strike - callTargetStrike); if (diff < bestCallDiff) { bestCallDiff = diff; bestCall = c } })
        processed[exp].byDistance[pct] = {
          put: bestPut ? { strike: bestPut.strike, delta: bestPut.delta, premium: bestPut.premium, volume: bestPut.volume } : null,
          call: bestCall ? { strike: bestCall.strike, delta: bestCall.delta, premium: bestCall.premium, volume: bestCall.volume } : null
        }
      })
    }
  })
  
  return { expirations: processed, allOptions, allIVs }
}

function formatChartData(data) {
  return Object.keys(data.expirations).sort().map(exp => {
    const expData = data.expirations[exp]
    const d10 = expData.deltas[10]
    const row = { 
      exp, expShort: formatDate(exp), isMonthly: expData.isMonthly,
      premiumSkew10: d10?.premiumSkew || 0,
      putVolume: d10?.putVolume || 0,
      callVolume: d10?.callVolume || 0,
      maxPain: expData.maxPain,
      expectedMove: expData.expectedMove
    }
    DELTAS.forEach(d => {
      if (expData.deltas[d]) {
        row[`d${d}`] = expData.deltas[d].premiumSkew !== null ? expData.deltas[d].premiumSkew : 0
        row[`d${d}_pct`] = expData.deltas[d].skewPct !== null ? parseFloat(expData.deltas[d].skewPct) : 0
        row[`d${d}_data`] = expData.deltas[d]
      }
    })
    row.byDistance = expData.byDistance
    row.allPuts = expData.allPuts
    row.allCalls = expData.allCalls
    return row
  })
}

// Process scanner data for a single ticker - using 25 DELTA
function processScannerData(results, price, ticker, monthlyDates) {
  if (!results || results.length === 0 || !price) {
    return { ticker, price, skewByDate: {} }
  }
  
  // Group options by expiration - ONLY monthly expirations
  const byExp = {}
  results.forEach(opt => {
    const { details = {}, greeks = {} } = opt
    const { expiration_date: exp, contract_type: type, strike_price: strike } = details
    const { delta } = greeks
    const premium = extractPremium(opt)
    
    if (!exp || !type || strike === undefined) return
    // Only include monthly expirations
    if (!isMonthlyExpiration(exp)) return
    
    if (!byExp[exp]) byExp[exp] = { puts: [], calls: [] }
    
    if (type === 'put') {
      byExp[exp].puts.push({ strike, delta, premium })
    } else if (type === 'call') {
      byExp[exp].calls.push({ strike, delta, premium })
    }
  })
  
  // Calculate 25-delta skew for each monthly expiration
  const skewByDate = {}
  
  monthlyDates.forEach(targetDate => {
    // Find the expiration that matches the target date
    const matchingExp = Object.keys(byExp).find(exp => exp === targetDate)
    
    if (!matchingExp || !byExp[matchingExp]) {
      skewByDate[targetDate] = null
      return
    }
    
    const { puts, calls } = byExp[matchingExp]
    const putTarget = -0.25 // 25 delta put
    const callTarget = 0.25 // 25 delta call
    
    // Find best 25-delta put
    let bestPut = null
    let bestPutDiff = Infinity
    puts.forEach(p => {
      if (p.delta !== undefined && p.delta !== null) {
        const diff = Math.abs(p.delta - putTarget)
        if (diff < bestPutDiff) {
          bestPutDiff = diff
          bestPut = p
        }
      }
    })
    
    // Find best 25-delta call
    let bestCall = null
    let bestCallDiff = Infinity
    calls.forEach(c => {
      if (c.delta !== undefined && c.delta !== null) {
        const diff = Math.abs(c.delta - callTarget)
        if (diff < bestCallDiff) {
          bestCallDiff = diff
          bestCall = c
        }
      }
    })
    
    // Calculate skew percentage
    if (bestPut && bestCall && bestPut.premium > 0 && bestCall.premium > 0) {
      const skewPct = ((bestPut.premium - bestCall.premium) / bestCall.premium) * 100
      skewByDate[targetDate] = skewPct
    } else {
      skewByDate[targetDate] = null
    }
  })
  
  return { ticker, price, skewByDate }
}

function analyzeAndSuggestTrades(chartData, ticker, stockPrice, priceHistory, fundamentals, allIVs, pcRatio) {
  if (!chartData?.length) return { insights: [], summary: null, peterLynch: null, ivRank: null, monthlyMetrics: null }
  const insights = [], stats = {}
  
  const currentIV = chartData[0]?.d10_data?.avgIV ? parseFloat(chartData[0].d10_data.avgIV) : null
  const ivRank = calculateIVRank(allIVs.map(iv => iv * 100))
  
  DELTAS.forEach(d => {
    const vals = chartData.map(r => r[`d${d}`]).filter(v => v !== undefined && v !== null)
    if (vals.length) {
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length
      const front = vals.slice(0, Math.ceil(vals.length / 3))
      const back = vals.slice(-Math.ceil(vals.length / 3))
      const frontAvg = front.length ? front.reduce((a, b) => a + b, 0) / front.length : 0
      const backAvg = back.length ? back.reduce((a, b) => a + b, 0) / back.length : 0
      const pctVals = chartData.map(r => r[`d${d}_pct`]).filter(v => v !== undefined && v !== null)
      const avgPct = pctVals.length ? pctVals.reduce((a, b) => a + b, 0) / pctVals.length : 0
      stats[d] = { avg: Math.round(avg * 100) / 100, avgPct: Math.round(avgPct * 10) / 10, termStructure: Math.round((backAvg - frontAvg) * 100) / 100, termDirection: backAvg > frontAvg ? 'up' : backAvg < frontAvg ? 'down' : 'flat' }
    }
  })

  const s10 = stats[10]
  if (s10) {
    if (s10.avgPct > 20) { insights.push({ type: 'warning', Icon: AlertTriangle, text: `High put premium (+${s10.avgPct}%). Puts trading significantly higher than calls.` }) }
    else if (s10.avgPct > 5) { insights.push({ type: 'info', Icon: TrendingDown, text: `Moderate put premium (+${s10.avgPct}%). Normal hedging activity.` }) }
    else if (s10.avgPct > -5) { insights.push({ type: 'neutral', Icon: Activity, text: `Balanced premium (${s10.avgPct > 0 ? '+' : ''}${s10.avgPct}%). Market neutral.` }) }
    else { insights.push({ type: 'success', Icon: TrendingUp, text: `Call premium higher (${s10.avgPct}%). Bullish sentiment.` }) }
  }

  const perf = calculatePerformance(priceHistory, stockPrice)
  const peterLynch = analyzePeterLynch(fundamentals)
  const firstMonthly = chartData.find(d => d.isMonthly)
  
  // Calculate monthly metrics (skew and expected move by month)
  const monthlyData = chartData.filter(d => d.isMonthly).slice(0, 3)
  const monthlyMetrics = monthlyData.map(m => ({
    exp: m.exp,
    month: getMonthName(m.exp),
    skew: m.d10_pct,
    expectedMove: m.expectedMove
  }))
  
  return {
    insights,
    summary: { ticker, stockPrice, stats: stats[10], ytd: perf.ytd, qtd: perf.qtd, fundamentals, 
      assessment: s10?.avgPct > 15 ? 'Elevated Fear' : s10?.avgPct > 0 ? 'Normal' : s10?.avgPct > -10 ? 'Balanced' : 'Bullish',
      maxPain: firstMonthly?.maxPain, expectedMove: firstMonthly?.expectedMove, pcRatio
    },
    peterLynch, ivRank, currentIV, monthlyMetrics
  }
}

// ============================================================================
// COMPONENTS
// ============================================================================

function DatePicker({ startDate, endDate, onStartChange, onEndChange }) {
  return (
    <div className="date-picker">
      <Calendar size={16} style={{ color: '#606070' }} />
      <input type="date" value={startDate} onChange={e => onStartChange(e.target.value)} />
      <span>→</span>
      <input type="date" value={endDate} onChange={e => onEndChange(e.target.value)} />
    </div>
  )
}

function TickerSelector({ tickers, customTickers, selected, onSelect, onAddCustom, onRemoveCustom, loading }) {
  const [inputValue, setInputValue] = useState('')
  const etfs = ['SPY', 'QQQ', 'IWM', 'GLD', 'SLV', 'DIA', 'VTI', 'VOO', 'EEM', 'XLF']
  const handleAdd = () => { const ticker = inputValue.trim().toUpperCase(); if (ticker && !tickers.includes(ticker) && !customTickers.includes(ticker)) { onAddCustom(ticker); setInputValue('') } }
  
  return (
    <div className="card">
      <div className="card-title" style={{ marginBottom: 12 }}><BarChart3 size={16} style={{ color: '#3b82f6' }} />Select Ticker (Click to Load)</div>
      {customTickers.length > 0 && (
        <div className="ticker-section">
          <div className="ticker-section-title">Custom</div>
          <div className="ticker-grid">
            {customTickers.map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <button className={`ticker-btn custom ${selected === t ? 'active' : ''} ${loading && selected === t ? 'loading' : ''}`} onClick={() => onSelect(t)}>{t}</button>
                <button onClick={() => onRemoveCustom(t)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}><X size={12} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="ticker-section">
        <div className="ticker-section-title">ETFs</div>
        <div className="ticker-grid">{tickers.filter(t => etfs.includes(t)).map(t => (<button key={t} className={`ticker-btn etf ${selected === t ? 'active' : ''} ${loading && selected === t ? 'loading' : ''}`} onClick={() => onSelect(t)}>{t}</button>))}</div>
      </div>
      <div className="ticker-section">
        <div className="ticker-section-title">Top 100 Stocks</div>
        <div className="ticker-grid">{tickers.filter(t => !etfs.includes(t)).map(t => (<button key={t} className={`ticker-btn ${selected === t ? 'active' : ''} ${loading && selected === t ? 'loading' : ''}`} onClick={() => onSelect(t)}>{t}</button>))}</div>
      </div>
      <div className="custom-ticker-input">
        <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAdd()} placeholder="Add custom ticker..." maxLength={5} />
        <button onClick={handleAdd}><Plus size={14} /> Add</button>
      </div>
    </div>
  )
}

// P/C Ratio Gauge Component
function PCRatioGauge({ pcRatio }) {
  if (!pcRatio) return null
  
  const ratio = parseFloat(pcRatio.ratio)
  // Normalize ratio for gauge (0.5 to 2.0 range mapped to 0-180 degrees)
  const normalizedRatio = Math.min(Math.max(ratio, 0.5), 2.0)
  const angle = ((normalizedRatio - 0.5) / 1.5) * 180
  
  // Color based on ratio
  let color = '#a0a0b0' // neutral
  if (ratio > 1.2) color = '#ef4444' // bearish (more puts)
  else if (ratio < 0.8) color = '#22c55e' // bullish (more calls)
  
  // Calculate totals
  const totalPutContracts = pcRatio.putVolume || 0
  const totalCallContracts = pcRatio.callVolume || 0
  
  // Format large numbers
  const formatNumber = (num) => {
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`
    if (num >= 1e3) return `${(num / 1e3).toFixed(0)}K`
    return num.toLocaleString()
  }
  
  return (
    <>
      <div className="metric-card">
        <div className="pc-gauge-container">
          <svg className="pc-gauge-svg" viewBox="0 0 100 60">
            {/* Background arc */}
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke="#2a2a3a"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Colored arc based on ratio */}
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(angle / 180) * 126} 126`}
            />
            {/* Needle */}
            <line
              x1="50"
              y1="50"
              x2={50 + 30 * Math.cos((180 - angle) * Math.PI / 180)}
              y2={50 - 30 * Math.sin((180 - angle) * Math.PI / 180)}
              stroke="#f0f0f5"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="50" cy="50" r="4" fill="#f0f0f5" />
            {/* Labels */}
            <text x="5" y="58" fontSize="6" fill="#22c55e">0.5</text>
            <text x="46" y="12" fontSize="6" fill="#a0a0b0">1.0</text>
            <text x="85" y="58" fontSize="6" fill="#ef4444">2.0</text>
          </svg>
          <div className="pc-gauge-value" style={{ color }}>{pcRatio.ratio}</div>
          <div className="pc-gauge-label">P/C Ratio</div>
        </div>
      </div>
      
      {/* Total Contracts Section - beside P/C Ratio */}
      <div className="metric-card">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#606070', marginBottom: 8 }}>Total Contracts (60 days)</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#ef4444' }}>{formatNumber(totalPutContracts)}</div>
              <div style={{ fontSize: 10, color: '#ef4444' }}>Puts</div>
            </div>
            <div style={{ color: '#606070', fontSize: 16 }}>/</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#22c55e' }}>{formatNumber(totalCallContracts)}</div>
              <div style={{ fontSize: 10, color: '#22c55e' }}>Calls</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Bell Curve Chart (Delta vs Premium)
function BellCurveChart({ chartData, stockPrice, ticker }) {
  const monthlyData = chartData.filter(d => d.isMonthly)
  const [selectedExp, setSelectedExp] = useState(0)
  
  if (monthlyData.length === 0) return null
  
  const selectedMonthly = monthlyData[selectedExp] || monthlyData[0]
  const puts = selectedMonthly.allPuts || []
  const calls = selectedMonthly.allCalls || []
  
  const curveData = []
  puts.filter(p => p.delta && p.delta >= -0.5 && p.delta <= 0 && p.premium > 0).forEach(p => {
    curveData.push({ delta: p.delta, premium: p.premium, strike: p.strike, type: 'put', iv: p.iv ? (p.iv * 100).toFixed(1) : null })
  })
  calls.filter(c => c.delta && c.delta >= 0 && c.delta <= 0.5 && c.premium > 0).forEach(c => {
    curveData.push({ delta: c.delta, premium: c.premium, strike: c.strike, type: 'call', iv: c.iv ? (c.iv * 100).toFixed(1) : null })
  })
  curveData.sort((a, b) => a.delta - b.delta)
  
  if (curveData.length === 0) return null
  
  return (
    <div className="bell-curve-container">
      <div className="bell-curve-title" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={14} style={{ color: '#8b5cf6' }} />
          Skew Bell Curve — {selectedMonthly.exp} (Monthly)
        </div>
        <select 
          value={selectedExp} 
          onChange={(e) => setSelectedExp(Number(e.target.value))}
          style={{ 
            background: '#1a1a24', 
            border: '1px solid #3b82f6', 
            borderRadius: 6, 
            padding: '6px 12px', 
            color: '#f0f0f5', 
            fontSize: 12,
            cursor: 'pointer'
          }}
        >
          {monthlyData.map((m, i) => (
            <option key={m.exp} value={i}>{m.exp} ({getMonthName(m.exp)})</option>
          ))}
        </select>
      </div>
      <div style={{ fontSize: 11, color: '#606070', marginBottom: 12 }}>Delta on X-axis • Premium on Y-axis • Shows put/call skew distribution</div>
      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, left: 10, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
            <XAxis 
              dataKey="delta" 
              type="number" 
              domain={[-0.5, 0.5]} 
              stroke="#606070" 
              tick={{ fontSize: 10 }}
              tickFormatter={v => v.toFixed(2)}
              label={{ value: 'Delta', position: 'bottom', offset: 5, style: { fill: '#606070', fontSize: 10 } }}
            />
            <YAxis 
              dataKey="premium"
              stroke="#606070" 
              tick={{ fontSize: 10 }}
              domain={[0, 'auto']}
              label={{ value: 'Premium ($)', angle: -90, position: 'insideLeft', style: { fill: '#606070', fontSize: 10 } }}
            />
            <Tooltip content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d = payload[0]?.payload
              return (
                <div style={{ background: '#12121a', border: '1px solid #2a2a3a', borderRadius: 8, padding: 10 }}>
                  <div style={{ fontWeight: 600, color: d.type === 'put' ? '#ef4444' : '#22c55e' }}>{d.type?.toUpperCase()}</div>
                  <div style={{ fontSize: 11 }}>Delta: {d.delta?.toFixed(2)}</div>
                  <div style={{ fontSize: 11 }}>Strike: ${d.strike}</div>
                  <div style={{ fontSize: 11 }}>Premium: ${d.premium?.toFixed(2)}</div>
                  {d.iv && <div style={{ fontSize: 11 }}>IV: {d.iv}%</div>}
                </div>
              )
            }} />
            <ReferenceLine x={0} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'ATM', position: 'top', fill: '#f59e0b', fontSize: 10 }} />
            <Scatter data={curveData} fill="#8884d8">
              {curveData.map((entry, index) => (
                <Cell key={index} fill={entry.type === 'put' ? '#ef4444' : '#22c55e'} r={5} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="bell-curve-legend">
        <div className="bell-curve-legend-item"><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }}></div><span style={{ color: '#ef4444' }}>Puts</span></div>
        <div className="bell-curve-legend-item"><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }}></div><span style={{ color: '#22c55e' }}>Calls</span></div>
      </div>
    </div>
  )
}

// Volatility Smile Chart (Strike vs IV)
function VolatilitySmileChart({ chartData, stockPrice, ticker }) {
  const monthlyData = chartData.filter(d => d.isMonthly)
  const [selectedExp, setSelectedExp] = useState(0)
  
  if (monthlyData.length === 0) return null
  
  const selectedMonthly = monthlyData[selectedExp] || monthlyData[0]
  const puts = selectedMonthly.allPuts || []
  const calls = selectedMonthly.allCalls || []
  
  const smileData = []
  
  // Add puts (typically higher IV for OTM puts - left side of smile)
  puts.filter(p => p.iv && p.iv > 0 && p.strike).forEach(p => {
    smileData.push({ 
      strike: p.strike, 
      iv: p.iv * 100, 
      type: 'put',
      delta: p.delta,
      moneyness: stockPrice ? ((p.strike / stockPrice - 1) * 100).toFixed(1) : null
    })
  })
  
  // Add calls
  calls.filter(c => c.iv && c.iv > 0 && c.strike).forEach(c => {
    smileData.push({ 
      strike: c.strike, 
      iv: c.iv * 100, 
      type: 'call',
      delta: c.delta,
      moneyness: stockPrice ? ((c.strike / stockPrice - 1) * 100).toFixed(1) : null
    })
  })
  
  smileData.sort((a, b) => a.strike - b.strike)
  
  if (smileData.length === 0) return null
  
  // Find ATM strike
  const atmStrike = stockPrice ? Math.round(stockPrice) : null
  
  return (
    <div className="bell-curve-container">
      <div className="bell-curve-title" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={14} style={{ color: '#06b6d4' }} />
          Volatility Smile — {selectedMonthly.exp} (Monthly)
        </div>
        <select 
          value={selectedExp} 
          onChange={(e) => setSelectedExp(Number(e.target.value))}
          style={{ 
            background: '#1a1a24', 
            border: '1px solid #06b6d4', 
            borderRadius: 6, 
            padding: '6px 12px', 
            color: '#f0f0f5', 
            fontSize: 12,
            cursor: 'pointer'
          }}
        >
          {monthlyData.map((m, i) => (
            <option key={m.exp} value={i}>{m.exp} ({getMonthName(m.exp)})</option>
          ))}
        </select>
      </div>
      <div style={{ fontSize: 11, color: '#606070', marginBottom: 12 }}>Strike Price on X-axis • Implied Volatility on Y-axis • Classic "smile" shape shows higher IV for OTM options</div>
      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, left: 10, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
            <XAxis 
              dataKey="strike" 
              type="number" 
              stroke="#606070" 
              tick={{ fontSize: 10 }}
              tickFormatter={v => `$${v}`}
              domain={['auto', 'auto']}
              label={{ value: 'Strike Price', position: 'bottom', offset: 5, style: { fill: '#606070', fontSize: 10 } }}
            />
            <YAxis 
              dataKey="iv"
              stroke="#606070" 
              tick={{ fontSize: 10 }}
              domain={['auto', 'auto']}
              tickFormatter={v => `${v.toFixed(0)}%`}
              label={{ value: 'Implied Volatility (%)', angle: -90, position: 'insideLeft', style: { fill: '#606070', fontSize: 10 } }}
            />
            <Tooltip content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d = payload[0]?.payload
              return (
                <div style={{ background: '#12121a', border: '1px solid #2a2a3a', borderRadius: 8, padding: 10 }}>
                  <div style={{ fontWeight: 600, color: d.type === 'put' ? '#ef4444' : '#22c55e' }}>{d.type?.toUpperCase()}</div>
                  <div style={{ fontSize: 11 }}>Strike: ${d.strike}</div>
                  <div style={{ fontSize: 11 }}>IV: {d.iv?.toFixed(1)}%</div>
                  {d.delta && <div style={{ fontSize: 11 }}>Delta: {d.delta?.toFixed(2)}</div>}
                  {d.moneyness && <div style={{ fontSize: 11 }}>From ATM: {d.moneyness}%</div>}
                </div>
              )
            }} />
            {atmStrike && <ReferenceLine x={atmStrike} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'ATM', position: 'top', fill: '#f59e0b', fontSize: 10 }} />}
            <Scatter data={smileData} fill="#8884d8">
              {smileData.map((entry, index) => (
                <Cell key={index} fill={entry.type === 'put' ? '#ef4444' : '#22c55e'} r={4} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="bell-curve-legend">
        <div className="bell-curve-legend-item"><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }}></div><span style={{ color: '#ef4444' }}>Puts</span></div>
        <div className="bell-curve-legend-item"><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }}></div><span style={{ color: '#22c55e' }}>Calls</span></div>
      </div>
      <div className="chart-explanation" style={{ marginTop: 12 }}>
        <strong>Volatility Smile:</strong> OTM puts (left) typically have higher IV due to crash protection demand. 
        The "smile" shape emerges because both deep OTM puts and calls have elevated IV compared to ATM options.
      </div>
    </div>
  )
}

function MonthlySummary({ summaryText }) {
  if (!summaryText) return null
  return (
    <div className="summary-box">
      <div className="summary-title"><Info size={14} /> Options Summary</div>
      <div className="summary-text" dangerouslySetInnerHTML={{ __html: summaryText }} />
    </div>
  )
}

// Monthly breakdown metrics for Skew and Expected Move
function MonthlyBreakdownMetrics({ monthlyMetrics }) {
  if (!monthlyMetrics || monthlyMetrics.length === 0) return null
  
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#f59e0b' }}>📅 Monthly Breakdown</div>
      <div className="monthly-metrics-grid">
        {monthlyMetrics.map((m, i) => (
          <div key={i} className="monthly-metric">
            <div className="monthly-metric-label">{m.month} Skew</div>
            <div className="monthly-metric-value" style={{ 
              color: m.skew > 0 ? '#ef4444' : m.skew < 0 ? '#22c55e' : '#a0a0b0' 
            }}>
              {m.skew !== undefined ? `${m.skew > 0 ? '+' : ''}${m.skew.toFixed(1)}%` : '-'}
            </div>
          </div>
        ))}
      </div>
      <div className="monthly-metrics-grid" style={{ marginTop: 8 }}>
        {monthlyMetrics.map((m, i) => (
          <div key={i} className="monthly-metric">
            <div className="monthly-metric-label">{m.month} Exp Move</div>
            <div className="monthly-metric-value" style={{ color: '#8b5cf6' }}>
              {m.expectedMove ? `±$${m.expectedMove.dollars}` : '-'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function KeyMetrics({ analysis, stockPrice, tastyMetrics }) {
  const { ivRank, summary } = analysis
  const stats = summary?.stats
  const pcRatio = summary?.pcRatio
  
  return (
    <div>
      <div className="metrics-grid">
        <div className="metric-card highlight">
          <div className="metric-value" style={{ color: '#22c55e' }}>${stockPrice?.toFixed(2) || '-'}</div>
          <div className="metric-label">Stock Price</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value" style={{ color: stats?.avgPct > 0 ? '#ef4444' : stats?.avgPct < 0 ? '#22c55e' : '#a0a0b0' }}>
            {stats?.avgPct !== undefined ? `${stats.avgPct > 0 ? '+' : ''}${stats.avgPct}%` : '-'}
          </div>
          <div className="metric-label">Avg Skew</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value">
            {stats?.termDirection === 'up' ? <span style={{ color: '#ef4444' }}>↓</span> : stats?.termDirection === 'down' ? <span style={{ color: '#22c55e' }}>↑</span> : <span style={{ color: '#606070' }}>→</span>}
          </div>
          <div className="metric-label">Term Struct</div>
          <div className="metric-sub">{stats?.termDirection === 'up' ? 'Backwardation' : stats?.termDirection === 'down' ? 'Contango' : 'Flat'}</div>
          <div className="metric-explanation">
            <strong>Term Structure</strong> measures how option skew changes across expirations.<br/>
            <span style={{ color: '#ef4444' }}>Backwardation (↓)</span>: Near-term puts are more expensive than far-term puts. This signals <strong>immediate fear/hedging</strong> - traders are paying up for short-term protection.<br/>
            <span style={{ color: '#22c55e' }}>Contango (↑)</span>: Far-term puts are more expensive than near-term puts. This is <strong>normal/bullish</strong> - no immediate panic, hedging is gradual.<br/>
            <span style={{ color: '#606070' }}>Flat (→)</span>: Skew is consistent across expirations - neutral sentiment.
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value" style={{ color: '#f59e0b' }}>${summary?.maxPain?.toFixed(0) || '-'}</div>
          <div className="metric-label">Max Pain</div>
          <div className="metric-explanation">
            <strong>Max Pain</strong> is the strike price where most options (puts + calls) expire worthless. Market makers may push price toward this level by expiration as it minimizes their payout.
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value" style={{ color: '#8b5cf6' }}>±${summary?.expectedMove?.dollars || '-'}</div>
          <div className="metric-label">Exp Move</div>
          <div className="metric-sub">{summary?.expectedMove?.percent ? `±${summary.expectedMove.percent}%` : '-'}</div>
        </div>
        
        {/* P/C Ratio Gauge */}
        <PCRatioGauge pcRatio={pcRatio} />
      </div>
      
      {/* TastyTrade Metrics Section */}
      {!tastyMetrics && tastyTradeClient.authError && (
        <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(225, 29, 72, 0.1)', border: '1px solid rgba(225, 29, 72, 0.3)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#f87171' }}>
          <AlertTriangle size={14} />
          TastyTrade session expired — IV Rank/Percentile unavailable
        </div>
      )}
      {tastyMetrics && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#e11d48', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ background: '#e11d48', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>TastyTrade</span>
            IV Metrics
          </div>
          <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="metric-card" style={{ borderColor: '#e11d48', background: 'rgba(225, 29, 72, 0.05)' }}>
              <div className="metric-value" style={{ color: tastyMetrics.ivRank > 50 ? '#ef4444' : tastyMetrics.ivRank < 30 ? '#22c55e' : '#f59e0b' }}>
                {tastyMetrics.ivRank !== null ? `${Math.round(tastyMetrics.ivRank)}%` : '-'}
              </div>
              <div className="metric-label">IV Rank</div>
              <div className="metric-sub">TastyTrade</div>
            </div>
            
            <div className="metric-card" style={{ borderColor: '#e11d48', background: 'rgba(225, 29, 72, 0.05)' }}>
              <div className="metric-value" style={{ color: (tastyMetrics.ivPercentile * 100) > 50 ? '#ef4444' : (tastyMetrics.ivPercentile * 100) < 30 ? '#22c55e' : '#f59e0b' }}>
                {tastyMetrics.ivPercentile !== null ? `${Math.round(tastyMetrics.ivPercentile * 100)}%` : '-'}
              </div>
              <div className="metric-label">IV Percentile</div>
              <div className="metric-sub">TastyTrade</div>
            </div>
            
            <div className="metric-card" style={{ borderColor: '#e11d48', background: 'rgba(225, 29, 72, 0.05)' }}>
              <div className="metric-value" style={{ color: tastyMetrics.iv5DayChange > 0 ? '#ef4444' : tastyMetrics.iv5DayChange < 0 ? '#22c55e' : '#a0a0b0' }}>
                {tastyMetrics.iv5DayChange !== null ? `${tastyMetrics.iv5DayChange > 0 ? '+' : ''}${(tastyMetrics.iv5DayChange * 100).toFixed(1)}%` : '-'}
              </div>
              <div className="metric-label">5-Day Change</div>
              <div className="metric-sub">IV Index</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SkewChartWithVolume({ chartData, ticker }) {
  if (!chartData?.length) return <div style={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#606070' }}>No data</div>
  const maxVolume = Math.max(...chartData.map(d => Math.max(d.putVolume || 0, d.callVolume || 0)))

  return (
    <div>
      <div style={{ height: 350 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
            <XAxis dataKey="expShort" stroke="#606070" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" interval={0} />
            <YAxis yAxisId="skew" stroke="#606070" tick={{ fontSize: 11 }} label={{ value: 'Skew (%)', angle: -90, position: 'insideLeft', style: { fill: '#606070', fontSize: 11 } }} />
            <YAxis yAxisId="volume" orientation="right" stroke="#606070" domain={[0, maxVolume * 3]} hide />
            <Tooltip content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              const d = payload[0]?.payload
              return (
                <div style={{ background: '#12121a', border: '1px solid #2a2a3a', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{label} {d?.isMonthly && <span style={{ color: '#f59e0b' }}>(Monthly)</span>}</div>
                  <div style={{ fontSize: 12, color: '#3b82f6' }}>10Δ: {d?.d10_pct?.toFixed(1)}%</div>
                  <div style={{ fontSize: 12, color: '#8b5cf6' }}>20Δ: {d?.d20_pct?.toFixed(1)}%</div>
                  <div style={{ fontSize: 12, color: '#06b6d4' }}>30Δ: {d?.d30_pct?.toFixed(1)}%</div>
                  <div style={{ fontSize: 12, color: '#f59e0b' }}>40Δ: {d?.d40_pct?.toFixed(1)}%</div>
                  <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>Put Vol: {d?.putVolume?.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: '#22c55e' }}>Call Vol: {d?.callVolume?.toLocaleString()}</div>
                </div>
              )
            }} />
            <ReferenceLine yAxisId="skew" y={0} stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" />
            <Bar yAxisId="volume" dataKey="putVolume" fill="rgba(239, 68, 68, 0.4)" />
            <Bar yAxisId="volume" dataKey="callVolume" fill="rgba(34, 197, 94, 0.4)" />
            <Line yAxisId="skew" type="monotone" dataKey="d10_pct" name="10Δ" stroke={COLORS[10]} strokeWidth={3} dot={(props) => <circle cx={props.cx} cy={props.cy} r={props.payload.isMonthly ? 6 : 4} fill={props.payload.isMonthly ? '#f59e0b' : COLORS[10]} stroke={props.payload.isMonthly ? '#f59e0b' : COLORS[10]} strokeWidth={2} />} />
            <Line yAxisId="skew" type="monotone" dataKey="d20_pct" name="20Δ" stroke={COLORS[20]} strokeWidth={2} dot={false} />
            <Line yAxisId="skew" type="monotone" dataKey="d30_pct" name="30Δ" stroke={COLORS[30]} strokeWidth={2} dot={false} />
            <Line yAxisId="skew" type="monotone" dataKey="d40_pct" name="40Δ" stroke={COLORS[40]} strokeWidth={2} dot={false} strokeDasharray="5 5" />
            <Legend />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="exp-legend">
        <div className="exp-legend-item"><div className="exp-dot monthly"></div><span>Monthly</span></div>
        <div className="exp-legend-item"><div className="exp-dot weekly"></div><span>Weekly</span></div>
        <div className="volume-legend-item"><div className="volume-box put"></div><span>Put Vol</span></div>
        <div className="volume-legend-item"><div className="volume-box call"></div><span>Call Vol</span></div>
      </div>
      <div className="chart-explanation">
        <strong>How to read:</strong> The <span className="bearish">orange line at 0</span> is neutral. 
        <strong> Above 0</strong> = <span className="bearish">Puts more expensive</span> → Bearish/hedging. 
        <strong> Below 0</strong> = <span className="bullish">Calls more expensive</span> → Bullish.
      </div>
    </div>
  )
}

function PriceChartWithEarnings({ priceHistory, ticker, earnings }) {
  if (!priceHistory?.length) return null
  const chartData = priceHistory.map(d => ({ date: formatDate(d.date), fullDate: d.date, price: d.close, volume: d.volume || 0 }))
  const maxVolume = Math.max(...chartData.map(d => d.volume))
  const earningsDates = new Set((earnings || []).map(e => e.date))
  chartData.forEach(d => { d.isEarnings = earningsDates.has(d.fullDate) })

  return (
    <div className="price-chart-container">
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <DollarSign size={14} style={{ color: '#22c55e' }} />
        {ticker} — 365 Days
        {earnings?.length > 0 && <span style={{ fontSize: 11, color: '#f59e0b', marginLeft: 8 }}>📅 E = Earnings</span>}
      </div>
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
            <XAxis dataKey="date" stroke="#606070" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" interval={Math.floor(chartData.length / 10)} />
            <YAxis yAxisId="price" stroke="#606070" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
            <YAxis yAxisId="volume" orientation="right" stroke="#606070" domain={[0, maxVolume * 3]} hide />
            <Tooltip content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              const d = payload[0]?.payload
              return (
                <div style={{ background: '#12121a', border: '1px solid #2a2a3a', borderRadius: 8, padding: 10 }}>
                  <div style={{ fontWeight: 600 }}>{label} {d?.isEarnings && <span style={{ color: '#f59e0b' }}>📅 EARNINGS</span>}</div>
                  <div>Price: ${d?.price?.toFixed(2)}</div>
                  <div>Volume: {d?.volume?.toLocaleString()}</div>
                </div>
              )
            }} />
            <Bar yAxisId="volume" dataKey="volume" fill="rgba(96, 96, 112, 0.3)" />
            <Area yAxisId="price" type="monotone" dataKey="price" stroke="#22c55e" strokeWidth={2} fill="url(#priceGradient)" />
            {chartData.filter(d => d.isEarnings).map((d, i) => (
              <ReferenceLine key={i} yAxisId="price" x={d.date} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'E', position: 'top', fill: '#f59e0b', fontSize: 12, fontWeight: 'bold' }} />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function FullFinvizTable({ fundamentals, nextEarnings }) {
  if (!fundamentals) return null
  
  const rows = [
    ['Index', fundamentals.Index || 'S&P 500', 'P/E', fundamentals['P/E'] || '-', 'EPS (ttm)', fundamentals['EPS (ttm)'] || '-', 'Insider Own', fundamentals['Insider Own'] || '-'],
    ['Market Cap', fundamentals['Market Cap'] || '-', 'Forward P/E', fundamentals['Forward P/E'] || '-', 'EPS next Y†', fundamentals['EPS next Y†'] || '-', 'Shs Outstand', fundamentals['Shs Outstand'] || '-'],
    ['Income', fundamentals.Income || '-', 'PEG', fundamentals.PEG || '-', 'EPS next Q', fundamentals['EPS next Q'] || '-', 'Shs Float', fundamentals['Shs Float'] || '-'],
    ['Sales', fundamentals.Sales || '-', 'P/S', fundamentals['P/S'] || '-', 'EPS this Y†', fundamentals['EPS this Y†'] || '-', 'Short Float', fundamentals['Short Float'] || '-'],
    ['Book/sh', fundamentals['Book/sh'] || '-', 'P/B', fundamentals['P/B'] || '-', 'EPS next 5Y', fundamentals['EPS next 5Y'] || '-', 'Short Ratio', fundamentals['Short Ratio'] || '-'],
    ['Cash/sh', fundamentals['Cash/sh'] || '-', 'P/C', fundamentals['P/C'] || '-', 'EPS past 5Y', fundamentals['EPS past 5Y'] || '-', 'Target Price', fundamentals['Target Price'] || '-'],
    ['Dividend', fundamentals.Dividend || '-', 'P/FCF', fundamentals['P/FCF'] || '-', 'Sales Q/Q', fundamentals['Sales Q/Q'] || '-', '52W Range', fundamentals['52W Range'] || '-'],
    ['Dividend %', fundamentals['Dividend %'] || '-', 'Quick Ratio', fundamentals['Quick Ratio'] || '-', 'EPS Q/Q', fundamentals['EPS Q/Q'] || '-', '52W High', fundamentals['52W High'] || '-'],
    ['Beta', fundamentals.Beta || '-', 'Current Ratio', fundamentals['Current Ratio'] || '-', 'ROA', fundamentals.ROA || '-', '52W Low', fundamentals['52W Low'] || '-'],
    ['ATR', fundamentals.ATR || '-', 'Debt/Eq', fundamentals['Debt/Eq'] || '-', 'ROE', fundamentals.ROE || '-', 'RSI (14)', fundamentals['RSI (14)'] || '-'],
    ['Volatility', fundamentals.Volatility || '-', 'LT Debt/Eq†', fundamentals['LT Debt/Eq†'] || '-', 'ROI', fundamentals.ROI || '-', 'Change', fundamentals.Change || '-'],
  ]
  
  return (
    <div>
      <table className="finviz-table">
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => {
                const isValue = j % 2 === 1
                let className = ''
                if (isValue && typeof cell === 'string') {
                  if (cell.startsWith('-') && cell.includes('%')) className = 'negative'
                  else if (cell.includes('%') && !cell.startsWith('-')) className = 'positive'
                }
                return <td key={j} className={className}>{cell}</td>
              })}
            </tr>
          ))}
        </tbody>
      </table>
      
      <div style={{ fontSize: 11, color: '#606070', marginTop: 6, paddingLeft: 4 }}>† Approximate — FMP free tier limitation</div>

      {nextEarnings && (
        <div className="next-earnings">
          <span className="next-earnings-icon">📅</span>
          <span className="next-earnings-text">Next Earnings:</span>
          <span className="next-earnings-date">{formatFullDate(nextEarnings)}</span>
        </div>
      )}
    </div>
  )
}

function InsightsPanel({ analysis, nextEarnings }) {
  const { insights, summary, peterLynch, monthlyMetrics } = analysis
  const fundamentals = summary?.fundamentals
  
  return (
    <div className="card">
      <div className="insights-header">
        <Info size={16} style={{ color: '#3b82f6' }} />
        <h3>Market Insights — {summary?.ticker}</h3>
        {summary?.assessment && (<span className={`assessment ${summary.assessment === 'Elevated Fear' ? 'fear' : summary.assessment === 'Bullish' ? 'bullish' : 'neutral'}`}>{summary.assessment}</span>)}
      </div>
      
      <div className="insights-list">{insights.map((ins, i) => (<div key={i} className={`insight ${ins.type}`}><ins.Icon size={16} style={{ flexShrink: 0, marginTop: 2, color: ins.type === 'warning' ? '#ef4444' : ins.type === 'info' ? '#3b82f6' : ins.type === 'success' ? '#22c55e' : '#a0a0b0' }} /><p className="insight-text">{ins.text}</p></div>))}</div>

      {summary?.expectedMove && (
        <div style={{ marginTop: 16, padding: 12, background: 'rgba(139, 92, 246, 0.1)', borderRadius: 8, border: '1px solid rgba(139, 92, 246, 0.3)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#8b5cf6', marginBottom: 8 }}>📊 Expected Move (Next Monthly)</div>
          <div style={{ fontSize: 13 }}>
            Range: <span style={{ color: '#ef4444', fontWeight: 600 }}>${summary.expectedMove.lowerBound}</span> — <span style={{ color: '#22c55e', fontWeight: 600 }}>${summary.expectedMove.upperBound}</span>
            <span style={{ color: '#606070', marginLeft: 8 }}>(±{summary.expectedMove.percent}%)</span>
          </div>
        </div>
      )}
      
      {/* Monthly breakdown for Skew and Expected Move */}
      <MonthlyBreakdownMetrics monthlyMetrics={monthlyMetrics} />

      {fundamentals && (
        <div className="stats-section">
          <h4 className="stats-title">Fundamentals (Finviz Style)</h4>
          <FullFinvizTable fundamentals={fundamentals} nextEarnings={nextEarnings} />
        </div>
      )}
      
      {peterLynch && peterLynch.valuation !== 'unknown' && (
        <div className={`valuation-box ${peterLynch.valuation}`}>
          <div className="valuation-title" style={{ color: peterLynch.valuation === 'undervalued' ? '#22c55e' : peterLynch.valuation === 'overvalued' ? '#ef4444' : '#f59e0b' }}>📊 Peter Lynch: {peterLynch.valuation.toUpperCase()}</div>
          <p className="valuation-text">{peterLynch.text}</p>
        </div>
      )}
    </div>
  )
}

function MonthlyOptionsSummaryBox({ chartData }) {
  const summaryText = generateMonthlyOptionsSummary(chartData)
  if (!summaryText) return null
  
  return (
    <div className="monthly-summary-box">
      <div className="monthly-summary-title">📅 Monthly Options Analysis</div>
      <div className="monthly-summary-text" dangerouslySetInnerHTML={{ __html: summaryText }} />
    </div>
  )
}

function DeltaTable({ chartData, stockPrice, ticker }) {
  const [open, setOpen] = useState(true)
  if (!chartData?.length) return null

  return (
    <div className="card" style={{ padding: 0 }}>
      <button className="table-toggle" onClick={() => setOpen(!open)}>
        <span>Delta Table — {ticker} (${stockPrice?.toFixed(2)})</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && (
        <>
          <div style={{ padding: '0 16px' }}>
            <MonthlyOptionsSummaryBox chartData={chartData} />
          </div>
          <div className="formula-box" style={{ margin: '0 16px 12px' }}>
            <strong>Formulas:</strong> <code>Skew % = (Put − Call) / Call × 100</code> | <code>Imbal = Put Dist / Call Dist</code>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Exp</th>
                  <th>Δ</th>
                  <th className="right put-header">Put $ (Strike)</th>
                  <th className="right put-header">Put Dist</th>
                  <th className="right put-header">Put Vol</th>
                  <th className="right call-header border-left">Call $ (Strike)</th>
                  <th className="right call-header">Call Dist</th>
                  <th className="right call-header">Call Vol</th>
                  <th className="right border-left">Skew $</th>
                  <th className="right">Skew %</th>
                  <th className="center">Imbal</th>
                </tr>
              </thead>
              <tbody>
                {chartData.flatMap((row) =>
                  DELTAS.map((d, di) => {
                    const dd = row[`d${d}_data`]
                    if (!dd) return null
                    return (
                      <tr key={`${row.exp}-${d}`} className={row.isMonthly ? 'monthly' : ''}>
                        <td>{di === 0 && (<>{row.exp}<span className={`exp-badge ${row.isMonthly ? 'monthly' : 'weekly'}`}>{row.isMonthly ? 'MONTHLY' : 'W'}</span></>)}</td>
                        <td><span className="delta-badge" style={{ background: COLORS[d] + '25', color: COLORS[d] }}>{d}Δ</span></td>
                        <td className="right" style={{ color: '#ef4444', fontWeight: 600 }}>{dd.putPremium !== null ? <><span>${dd.putPremium.toFixed(2)}</span><span style={{ color: '#606070', fontSize: 10, fontWeight: 400 }}> (${dd.putStrike})</span></> : '-'}</td>
                        <td className="right"><span style={{ color: '#ef4444' }}>${dd.putDistance}</span><span className="pct-diff negative"> ({dd.putPctFromStock}%)</span></td>
                        <td className="right" style={{ color: '#a0a0b0' }}>{dd.putVolume?.toLocaleString() || '-'}</td>
                        <td className="right border-left" style={{ color: '#22c55e', fontWeight: 600 }}>{dd.callPremium !== null ? <><span>${dd.callPremium.toFixed(2)}</span><span style={{ color: '#606070', fontSize: 10, fontWeight: 400 }}> (${dd.callStrike})</span></> : '-'}</td>
                        <td className="right"><span style={{ color: '#22c55e' }}>${dd.callDistance}</span><span className="pct-diff positive"> (+{dd.callPctFromStock}%)</span></td>
                        <td className="right" style={{ color: '#a0a0b0' }}>{dd.callVolume?.toLocaleString() || '-'}</td>
                        <td className="right border-left" style={{ fontWeight: 600, color: dd.premiumSkew > 0 ? '#ef4444' : dd.premiumSkew < 0 ? '#22c55e' : '#a0a0b0' }}>{dd.premiumSkew !== null ? `$${dd.premiumSkew.toFixed(2)}` : '-'}</td>
                        <td className="right" style={{ fontWeight: 600, color: parseFloat(dd.skewPct) > 0 ? '#ef4444' : parseFloat(dd.skewPct) < 0 ? '#22c55e' : '#a0a0b0' }}>{dd.skewPct !== null ? `${parseFloat(dd.skewPct) > 0 ? '+' : ''}${dd.skewPct}%` : '-'}</td>
                        <td className="center" style={{ fontWeight: 600, color: dd.imbalance > 1.2 ? '#ef4444' : dd.imbalance < 0.8 ? '#22c55e' : '#a0a0b0' }}>{dd.imbalance || '-'}</td>
                      </tr>
                    )
                  }).filter(Boolean)
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function DistanceTable({ chartData, stockPrice, ticker }) {
  const [open, setOpen] = useState(true)
  if (!chartData?.length || !stockPrice) return null
  const rows = []
  chartData.forEach(row => { DISTANCE_PERCENTS.forEach(pct => { const bd = row.byDistance?.[pct]; if (bd) rows.push({ exp: row.exp, isMonthly: row.isMonthly, pct, put: bd.put, call: bd.call }) }) })

  return (
    <div className="card" style={{ padding: 0 }}>
      <button className="table-toggle" onClick={() => setOpen(!open)}>
        <span>Strike by Distance — {ticker} (${stockPrice.toFixed(2)})</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Expiration</th>
                <th className="center">%</th>
                <th className="center put-header">Put Delta (Strike)</th>
                <th className="center call-header border-left">Call Delta (Strike)</th>
                <th className="center border-left">Δ Diff</th>
                <th className="center">Δ Diff %</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const putDelta = row.put?.delta
                const callDelta = row.call?.delta
                const deltaDiff = (putDelta !== undefined && callDelta !== undefined) ? (Math.abs(putDelta) - callDelta).toFixed(2) : null
                const deltaDiffPct = (putDelta !== undefined && callDelta !== undefined && callDelta !== 0) ? (((Math.abs(putDelta) - callDelta) / callDelta) * 100).toFixed(1) : null
                const isFirstPct = i === 0 || rows[i-1]?.exp !== row.exp
                return (
                  <tr key={`${row.exp}-${row.pct}`} className={row.isMonthly ? 'monthly' : ''}>
                    <td>{isFirstPct && (<>{row.exp}<span className={`exp-badge ${row.isMonthly ? 'monthly' : 'weekly'}`}>{row.isMonthly ? 'MONTHLY' : 'W'}</span></>)}</td>
                    <td className="center"><span className="pct-badge" style={{ color: '#f59e0b' }}>±{row.pct}%</span></td>
                    <td className="center">{row.put ? (<><span className="delta-display" style={{ color: '#ef4444' }}>{row.put.delta?.toFixed(2)}</span><span className="strike-display"> (${row.put.strike})</span></>) : '-'}</td>
                    <td className="center border-left">{row.call ? (<><span className="delta-display" style={{ color: '#22c55e' }}>{row.call.delta?.toFixed(2)}</span><span className="strike-display"> (${row.call.strike})</span></>) : '-'}</td>
                    <td className="center border-left" style={{ fontWeight: 600, color: parseFloat(deltaDiff) > 0 ? '#ef4444' : parseFloat(deltaDiff) < 0 ? '#22c55e' : '#606070' }}>{deltaDiff !== null ? (parseFloat(deltaDiff) > 0 ? '+' : '') + deltaDiff : '-'}</td>
                    <td className="center" style={{ fontWeight: 600, color: parseFloat(deltaDiffPct) > 0 ? '#ef4444' : parseFloat(deltaDiffPct) < 0 ? '#22c55e' : '#606070' }}>{deltaDiffPct !== null ? `${parseFloat(deltaDiffPct) > 0 ? '+' : ''}${deltaDiffPct}%` : '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// SCANNER TAB COMPONENT
// ============================================================================

function ScannerTab() {
  const [scannerData, setScannerData] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentTicker, setCurrentTicker] = useState('')
  const [delay, setDelay] = useState(8) // DEFAULT 8 SECONDS
  const [sortConfig, setSortConfig] = useState({ key: 'ticker', direction: 'asc' })
  const abortRef = useRef(false)
  
  // Get the monthly expiration dates once
  const monthlyDates = useMemo(() => getNextMonthlyExpirations(), [])
  
  const startScan = async () => {
    setIsRunning(true)
    abortRef.current = false
    setScannerData([])
    setCurrentIndex(0)
    
    // Batch fetch TastyTrade metrics for all tickers first (more efficient)
    let tastyMetricsMap = {}
    try {
      tastyMetricsMap = await tastyTradeClient.fetchMarketMetrics(DEFAULT_TICKERS.join(','))
    } catch (e) {
      console.log('TastyTrade batch fetch failed, will try individual:', e)
    }
    
    for (let i = 0; i < DEFAULT_TICKERS.length; i++) {
      if (abortRef.current) break
      
      const ticker = DEFAULT_TICKERS[i]
      setCurrentIndex(i + 1)
      setCurrentTicker(ticker)
      
      try {
        const response = await apiClient.fetchOptionsForScanner(ticker, monthlyDates)
        const processed = processScannerData(response.results, response.price, ticker, monthlyDates)
        
        // Add TastyTrade metrics
        const tastyData = tastyMetricsMap[ticker] || null
        processed.tastyMetrics = tastyData
        
        setScannerData(prev => [...prev, processed])
      } catch (e) {
        console.log(`Error fetching ${ticker}:`, e)
        // Still add entry with just ticker name
        setScannerData(prev => [...prev, { ticker, price: null, skewByDate: {}, tastyMetrics: tastyMetricsMap[ticker] || null }])
      }
      
      // Delay before next request (unless last one)
      if (i < DEFAULT_TICKERS.length - 1 && !abortRef.current) {
        await new Promise(resolve => setTimeout(resolve, delay * 1000))
      }
    }
    
    setIsRunning(false)
    setCurrentTicker('')
  }
  
  const stopScan = () => {
    abortRef.current = true
    setIsRunning(false)
  }
  
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }
  
  const sortedData = useMemo(() => {
    const sorted = [...scannerData]
    sorted.sort((a, b) => {
      let aVal, bVal
      
      if (sortConfig.key === 'ticker') {
        aVal = a.ticker
        bVal = b.ticker
      } else if (sortConfig.key === 'price') {
        aVal = a.price || 0
        bVal = b.price || 0
      } else if (sortConfig.key === 'ivRank') {
        aVal = a.tastyMetrics?.ivRank ?? -9999
        bVal = b.tastyMetrics?.ivRank ?? -9999
      } else if (sortConfig.key === 'ivPercentile') {
        aVal = a.tastyMetrics?.ivPercentile ?? -9999
        bVal = b.tastyMetrics?.ivPercentile ?? -9999
      } else if (sortConfig.key === 'iv5DayChange') {
        aVal = a.tastyMetrics?.iv5DayChange ?? -9999
        bVal = b.tastyMetrics?.iv5DayChange ?? -9999
      } else if (sortConfig.key === 'liquidityRank') {
        aVal = a.tastyMetrics?.liquidityRank ?? -9999
        bVal = b.tastyMetrics?.liquidityRank ?? -9999
      } else {
        // It's a date key
        aVal = a.skewByDate[sortConfig.key] ?? -9999
        bVal = b.skewByDate[sortConfig.key] ?? -9999
      }
      
      if (typeof aVal === 'string') {
        return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal
    })
    return sorted
  }, [scannerData, sortConfig])
  
  const progress = (currentIndex / DEFAULT_TICKERS.length) * 100
  
  const formatSkewCell = (value) => {
    if (value === undefined || value === null) return <span className="skew-cell neutral">-</span>
    const formatted = value.toFixed(1)
    const className = value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral'
    return <span className={`skew-cell ${className}`}>{value > 0 ? '+' : ''}{formatted}%</span>
  }
  
  const formatDateHeader = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
  }
  
  const formatTastyValue = (value, type) => {
    if (value === undefined || value === null) return <span style={{ color: '#606070' }}>-</span>
    
    if (type === 'ivRank' || type === 'ivPercentile') {
      const color = value > 50 ? '#ef4444' : value < 30 ? '#22c55e' : '#f59e0b'
      return <span style={{ color, fontWeight: 600 }}>{value.toFixed(1)*100}</span>
    }
    if (type === 'iv5DayChange') {
      const color = value > 0 ? '#ef4444' : value < 0 ? '#22c55e' : '#a0a0b0'
      return <span style={{ color, fontWeight: 600 }}>{value > 0 ? '+' : ''}{(value * 100).toFixed(1)}%</span>
    }
    if (type === 'liquidityRank') {
      const color = value > 3 ? '#22c55e' : value > 1 ? '#f59e0b' : '#ef4444'
      return <span style={{ color, fontWeight: 600 }}>{value.toFixed(0)}</span>
    }
    return value
  }
  
  return (
    <div>
      {/* Controls */}
      <div className="scanner-controls">
        <div className="scanner-control-group">
          <label>Delay (sec):</label>
          <input 
            type="number" 
            min="1" 
            max="30" 
            value={delay} 
            onChange={e => setDelay(Math.max(1, Math.min(30, parseInt(e.target.value) || 8)))}
            disabled={isRunning}
          />
        </div>
        
        <div className="scanner-status">
          <div className={`status-dot ${isRunning ? 'running' : currentIndex === DEFAULT_TICKERS.length ? 'complete' : 'stopped'}`}></div>
          <span>
            {isRunning ? `Scanning ${currentTicker}...` : 
             currentIndex === DEFAULT_TICKERS.length ? 'Scan Complete' : 
             currentIndex > 0 ? 'Stopped' : 'Ready'}
          </span>
        </div>
        
        <div className="progress-bar">
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="progress-text">{currentIndex} / {DEFAULT_TICKERS.length} stocks</div>
        </div>
        
        {!isRunning ? (
          <button className="btn btn-primary" onClick={startScan}>
            <Play size={16} /> Start Scan
          </button>
        ) : (
          <button className="btn btn-danger" onClick={stopScan}>
            <Pause size={16} /> Stop
          </button>
        )}
      </div>
      
      {/* Results Table */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 16 }}>
          <Table2 size={16} style={{ color: '#3b82f6' }} />
          Monthly Options Skew Scanner (25Δ) + TastyTrade IV Metrics
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#606070' }}>
            {scannerData.length} stocks loaded
          </span>
        </div>
        
        {scannerData.length === 0 && !isRunning ? (
          <div className="scanner-empty">
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>📊</div>
            <h3 style={{ marginBottom: 8, color: '#a0a0b0' }}>No Data Yet</h3>
            <p>Click "Start Scan" to fetch 25Δ skew data and TastyTrade IV metrics for all 100 stocks</p>
          </div>
        ) : (
          <div className="scanner-table-container">
            <table className="scanner-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => handleSort('ticker')}>
                    Ticker {sortConfig.key === 'ticker' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="right sortable" onClick={() => handleSort('price')}>
                    Price {sortConfig.key === 'price' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  {monthlyDates.map((date) => (
                    <th key={date} className="right sortable" onClick={() => handleSort(date)}>
                      {formatDateHeader(date)} {sortConfig.key === date && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                  ))}
                  <th className="right sortable" style={{ borderLeft: '2px solid #e11d48', background: 'rgba(225, 29, 72, 0.1)' }} onClick={() => handleSort('ivRank')}>
                    IV Rank {sortConfig.key === 'ivRank' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="right sortable" style={{ background: 'rgba(225, 29, 72, 0.1)' }} onClick={() => handleSort('ivPercentile')}>
                    IV %tile {sortConfig.key === 'ivPercentile' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="right sortable" style={{ background: 'rgba(225, 29, 72, 0.1)' }} onClick={() => handleSort('iv5DayChange')}>
                    5D Chg {sortConfig.key === 'iv5DayChange' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="right sortable" style={{ background: 'rgba(225, 29, 72, 0.1)' }} onClick={() => handleSort('liquidityRank')}>
                    Liq {sortConfig.key === 'liquidityRank' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map(row => (
                  <tr key={row.ticker}>
                    <td style={{ fontWeight: 700, color: '#3b82f6' }}>
                      {row.ticker}
                    </td>
                    <td className="right price-cell">
                      {row.price ? `$${row.price.toFixed(2)}` : '-'}
                    </td>
                    {monthlyDates.map(date => (
                      <td key={date} className="right">
                        {formatSkewCell(row.skewByDate[date])}
                      </td>
                    ))}
                    <td className="right" style={{ borderLeft: '2px solid #e11d48' }}>
                      {formatTastyValue(row.tastyMetrics?.ivRank, 'ivRank')}
                    </td>
                    <td className="right">
                      {formatTastyValue(row.tastyMetrics?.ivPercentile, 'ivPercentile')}
                    </td>
                    <td className="right">
                      {formatTastyValue(row.tastyMetrics?.iv5DayChange, 'iv5DayChange')}
                    </td>
                    <td className="right">
                      {formatTastyValue(row.tastyMetrics?.liquidityRank, 'liquidityRank')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Explanation */}
      <div className="chart-explanation" style={{ marginTop: 16 }}>
        <strong>How to read:</strong> Skew % = (Put Premium − Call Premium) / Call Premium × 100 at <strong>25-delta</strong>. 
        <span className="bearish"> Positive (red)</span> = Puts more expensive → Bearish/hedging demand. 
        <span className="bullish"> Negative (green)</span> = Calls more expensive → Bullish sentiment.
        <strong> Click column headers to sort.</strong><br/>
        <span style={{ color: '#e11d48' }}><strong>TastyTrade columns:</strong></span> IV Rank, IV Percentile, 5-Day Change (IV Index), Liquidity Rank (1-5 scale).
      </div>
    </div>
  )
}

// ============================================================================
// DASHBOARD TAB COMPONENT
// ============================================================================

function DashboardTab() {
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 90); return d.toISOString().split('T')[0] })
  const [selected, setSelected] = useState('SPY')
  const [customTickers, setCustomTickers] = useState([])
  const [data, setData] = useState(null)
  const [stockPrice, setStockPrice] = useState(null)
  const [priceHistory, setPriceHistory] = useState([])
  const [earnings, setEarnings] = useState([])
  const [nextEarnings, setNextEarnings] = useState(null)
  const [fundamentals, setFundamentals] = useState(null)
  const [tastyMetrics, setTastyMetrics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async (ticker) => {
    setLoading(true)
    setError(null)
    setTastyMetrics(null)
    try {
      // Fetch Polygon data and TastyTrade metrics in parallel
      const [optionsRes, price, history, earningsData, nextEarn, tastyData] = await Promise.all([
        apiClient.fetchOptions(ticker, startDate, endDate),
        apiClient.fetchStockPrice(ticker),
        apiClient.fetchPriceHistory(ticker, 365),
        apiClient.fetchEarnings(ticker),
        apiClient.fetchNextEarnings(ticker),
        tastyTradeClient.fetchSingleMetric(ticker)
      ])
      setStockPrice(price)
      setPriceHistory(history)
      setEarnings(earningsData || [])
      setNextEarnings(nextEarn)
      setTastyMetrics(tastyData)
      
      // Fetch real fundamentals from FMP API (fallback to calculated technicals)
      const finvizData = await fetchFMPFundamentals(ticker, price, history) || buildBasicFundamentals(price, history)
      setFundamentals(finvizData)
      
      const processed = processOptionsData(optionsRes, price)
      const chartData = formatChartData(processed)
      const pcRatio = calculateTotalPCRatio(processed.allOptions)
      const analysis = analyzeAndSuggestTrades(chartData, ticker, price, history, finvizData, processed.allIVs, pcRatio)
      const monthlySummary = generateMonthlySummary(chartData, ticker, price, pcRatio)
      
      setData({ chartData, analysis, processed, monthlySummary, pcRatio })
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [startDate, endDate])

  const handleSelect = useCallback((ticker) => { 
    setSelected(ticker)
    fetchData(ticker) 
  }, [fetchData])
  
  const handleAddCustomTicker = (ticker) => { setCustomTickers(prev => [...prev, ticker]); handleSelect(ticker) }
  const handleRemoveCustomTicker = (ticker) => { setCustomTickers(prev => prev.filter(t => t !== ticker)); if (selected === ticker) handleSelect('SPY') }
  const maxEndDate = useMemo(() => { const d = new Date(startDate); d.setMonth(d.getMonth() + 6); return d.toISOString().split('T')[0] }, [startDate])

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <DatePicker startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={(d) => setEndDate(d > maxEndDate ? maxEndDate : d)} />
        <button className="btn btn-primary" onClick={() => fetchData(selected)} disabled={loading}>{loading ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}Refresh</button>
      </div>
      
      <div className="section"><TickerSelector tickers={DEFAULT_TICKERS} customTickers={customTickers} selected={selected} onSelect={handleSelect} onAddCustom={handleAddCustomTicker} onRemoveCustom={handleRemoveCustomTicker} loading={loading} /></div>

      {loading && (<div className="card loading"><Loader2 size={24} className="spin" style={{ color: '#3b82f6' }} />Loading {selected} data...</div>)}
      {error && (<div className="card" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}><div style={{ color: '#ef4444', fontWeight: 500 }}>Error: {error}</div></div>)}

      {data && !loading && (
        <>
          <div className="section"><KeyMetrics analysis={data.analysis} stockPrice={stockPrice} tastyMetrics={tastyMetrics} /></div>
          <MonthlySummary summaryText={data.monthlySummary} />
          
          <div className="card section">
            <div className="chart-header"><h2 className="chart-title"><span className="ticker">{selected}</span> — Premium Skew (%)</h2></div>
            <SkewChartWithVolume chartData={data.chartData} ticker={selected} />
            <PriceChartWithEarnings priceHistory={priceHistory} ticker={selected} earnings={earnings} />
          </div>
          
          <div className="card section">
            <BellCurveChart chartData={data.chartData} stockPrice={stockPrice} ticker={selected} />
          </div>
          
          <div className="card section">
            <VolatilitySmileChart chartData={data.chartData} stockPrice={stockPrice} ticker={selected} />
          </div>

          <div className="section"><InsightsPanel analysis={data.analysis} nextEarnings={nextEarnings} /></div>
          <div className="section"><DeltaTable chartData={data.chartData} stockPrice={stockPrice} ticker={selected} /></div>
          <div className="section"><DistanceTable chartData={data.chartData} stockPrice={stockPrice} ticker={selected} /></div>
        </>
      )}

      {!data && !loading && !error && (
        <div className="card" style={{ padding: 64, textAlign: 'center' }}>
          <BarChart3 size={48} style={{ color: '#2a2a3a', marginBottom: 16 }} />
          <h3 style={{ color: '#a0a0b0', marginBottom: 8 }}>Click a Ticker to Load Data</h3>
          <p style={{ color: '#606070', fontSize: 14 }}>Select any ticker above to see options skew analysis.</p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// BACKTEST TAB COMPONENT
// ============================================================================

function BacktestTab() {
  const [ticker, setTicker] = useState('SPY')
  const [targetDelta, setTargetDelta] = useState(10)
  const [strategy, setStrategy] = useState('sell_put') // sell_put, sell_call, sell_strangle
  const [lookbackDays, setLookbackDays] = useState(14)
  const [dteTarget, setDteTarget] = useState(7) // days to expiration target
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [logs, setLogs] = useState([])
  const [error, setError] = useState(null)

  const addLog = (msg, type = 'info') => setLogs(prev => [...prev, { msg, type, time: new Date().toLocaleTimeString() }])

  const runBacktest = useCallback(async () => {
    setLoading(true)
    setError(null)
    setResults(null)
    setLogs([])

    try {
      addLog(`Starting backtest: ${strategy === 'sell_put' ? 'Sell Put' : strategy === 'sell_call' ? 'Sell Call' : 'Sell Strangle'} at ${targetDelta}Δ on ${ticker}`)

      // Step 1: Get price history to find the entry date and stock price
      const today = new Date()

      addLog(`Fetching ${ticker} price history...`)
      const priceHistory = await apiClient.fetchPriceHistory(ticker, lookbackDays + 60)
      if (!priceHistory || priceHistory.length === 0) throw new Error('No price history available')

      // Find the entry date (trading day closest to lookbackDays ago)
      const entryTargetDate = new Date(today)
      entryTargetDate.setDate(entryTargetDate.getDate() - lookbackDays)

      let entryDay = null
      let minDiff = Infinity
      for (const day of priceHistory) {
        const diff = Math.abs(new Date(day.date) - entryTargetDate)
        if (diff < minDiff) { minDiff = diff; entryDay = day }
      }
      if (!entryDay) throw new Error('Could not find entry date in price history')

      const entryDate = entryDay.date
      const entryPrice = entryDay.close
      addLog(`Entry date: ${entryDate}, ${ticker} price: $${entryPrice.toFixed(2)}`)

      // Step 2: Estimate historical volatility for delta calculation
      const histVol = estimateHistoricalVol(priceHistory, 30)
      addLog(`Historical volatility (30d): ${(histVol * 100).toFixed(1)}%`)

      // Step 3: Find expiration date (closest weekly/monthly after entry + DTE target)
      const expiryTarget = new Date(entryDate + 'T00:00:00')
      expiryTarget.setDate(expiryTarget.getDate() + dteTarget)
      // Find nearest Friday
      const dayOfWeek = expiryTarget.getDay()
      const daysToFriday = dayOfWeek <= 5 ? (5 - dayOfWeek) : (5 - dayOfWeek + 7)
      expiryTarget.setDate(expiryTarget.getDate() + daysToFriday)
      const expiryDateStr = expiryTarget.toISOString().split('T')[0]
      const dte = Math.round((expiryTarget - new Date(entryDate + 'T00:00:00')) / (1000 * 60 * 60 * 24))

      addLog(`Target expiry: ${expiryDateStr} (${dte} DTE)`)

      // Step 4: Estimate strike for target delta using Black-Scholes
      const T = dte / 365
      const sigma = histVol * 1.1 // IV is typically ~10% higher than HV

      // Binary search for the strike that gives us the target delta
      const findStrikeForDelta = (targetDeltaAbs, type) => {
        let low = entryPrice * 0.7
        let high = entryPrice * 1.3
        const targetD = type === 'put' ? -(targetDeltaAbs / 100) : (targetDeltaAbs / 100)
        for (let i = 0; i < 50; i++) {
          const mid = (low + high) / 2
          const d = bsDelta(entryPrice, mid, T, sigma, 0.045, type)
          if (type === 'put') {
            if (d < targetD) high = mid
            else low = mid
          } else {
            if (d > targetD) low = mid
            else high = mid
          }
        }
        return Math.round((low + high) / 2)
      }

      const trades = []

      if (strategy === 'sell_put' || strategy === 'sell_strangle') {
        const putStrike = findStrikeForDelta(targetDelta, 'put')
        const putDelta = bsDelta(entryPrice, putStrike, T, sigma, 0.045, 'put')
        addLog(`Estimated ${targetDelta}Δ put strike: $${putStrike} (calc delta: ${putDelta.toFixed(3)})`)

        // Step 5: Fetch available put contracts near this strike
        addLog(`Fetching put contracts near $${putStrike}...`)
        const putContracts = await apiClient.fetchOptionsContracts(
          ticker, expiryDateStr, 'put',
          putStrike - 5, putStrike + 5
        )

        if (putContracts.length === 0) {
          addLog(`No put contracts found for ${expiryDateStr}. Trying nearby expiries...`, 'error')
          // Try +/- 1 day
          for (let offset = -1; offset <= 1; offset++) {
            if (offset === 0) continue
            const altExpiry = new Date(expiryTarget)
            altExpiry.setDate(altExpiry.getDate() + offset)
            const altExpiryStr = altExpiry.toISOString().split('T')[0]
            const altContracts = await apiClient.fetchOptionsContracts(
              ticker, altExpiryStr, 'put', putStrike - 5, putStrike + 5
            )
            if (altContracts.length > 0) {
              putContracts.push(...altContracts)
              addLog(`Found ${altContracts.length} contracts for ${altExpiryStr}`, 'success')
              break
            }
          }
        }

        if (putContracts.length > 0) {
          // Find the contract closest to our target strike
          let bestContract = putContracts[0]
          let bestDiff = Math.abs(bestContract.strike_price - putStrike)
          for (const c of putContracts) {
            const diff = Math.abs(c.strike_price - putStrike)
            if (diff < bestDiff) { bestDiff = diff; bestContract = c }
          }

          addLog(`Best match: ${bestContract.ticker} (strike $${bestContract.strike_price})`)

          // Step 6: Get historical price for this contract on entry date
          const optionPrice = await apiClient.fetchOptionHistoricalPrice(bestContract.ticker, entryDate)
          const premium = optionPrice ? optionPrice.c : null // close price

          if (premium) {
            addLog(`Put premium on ${entryDate}: $${premium.toFixed(2)}`, 'success')

            // Step 7: Check what happened at expiry
            let expiryStockPrice = null
            const actualExpiry = bestContract.expiration_date
            for (const day of priceHistory) {
              if (day.date === actualExpiry) { expiryStockPrice = day.close; break }
            }
            // If expiry hasn't happened yet or no exact match, use closest available
            if (!expiryStockPrice) {
              const expiryDate = new Date(actualExpiry + 'T00:00:00')
              let closestDay = null, minExpDiff = Infinity
              for (const day of priceHistory) {
                const diff = Math.abs(new Date(day.date) - expiryDate)
                if (diff < minExpDiff && new Date(day.date) >= expiryDate) {
                  minExpDiff = diff; closestDay = day
                }
              }
              if (closestDay) expiryStockPrice = closestDay.close
            }
            // Also try fetching the specific date
            if (!expiryStockPrice) {
              expiryStockPrice = await apiClient.fetchStockPriceOnDate(ticker, actualExpiry)
            }

            const intrinsicAtExpiry = expiryStockPrice ? Math.max(0, bestContract.strike_price - expiryStockPrice) : null
            const pnl = intrinsicAtExpiry !== null ? (premium - intrinsicAtExpiry) * 100 : null

            trades.push({
              type: 'put',
              strike: bestContract.strike_price,
              contractTicker: bestContract.ticker,
              expiry: actualExpiry,
              dte,
              entryDate,
              entryPrice,
              premium,
              expiryStockPrice,
              intrinsicAtExpiry,
              pnl,
              delta: putDelta,
              expired: expiryStockPrice !== null && new Date(actualExpiry) <= today
            })

            if (expiryStockPrice) {
              addLog(`${ticker} at expiry (${actualExpiry}): $${expiryStockPrice.toFixed(2)}`, expiryStockPrice >= bestContract.strike_price ? 'success' : 'error')
              addLog(`Intrinsic at expiry: $${intrinsicAtExpiry.toFixed(2)}`, intrinsicAtExpiry === 0 ? 'success' : 'error')
              addLog(`P&L (1 contract): ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`, pnl >= 0 ? 'success' : 'error')
            } else {
              addLog(`Expiry ${actualExpiry} not yet reached - showing open position`, 'info')
            }
          } else {
            addLog(`Could not fetch put option price for ${entryDate}`, 'error')
          }
        } else {
          addLog(`No put contracts found near $${putStrike} for any expiry`, 'error')
        }
      }

      if (strategy === 'sell_call' || strategy === 'sell_strangle') {
        const callStrike = findStrikeForDelta(targetDelta, 'call')
        const callDelta = bsDelta(entryPrice, callStrike, T, sigma, 0.045, 'call')
        addLog(`Estimated ${targetDelta}Δ call strike: $${callStrike} (calc delta: ${callDelta.toFixed(3)})`)

        addLog(`Fetching call contracts near $${callStrike}...`)
        const callContracts = await apiClient.fetchOptionsContracts(
          ticker, expiryDateStr, 'call',
          callStrike - 5, callStrike + 5
        )

        if (callContracts.length > 0) {
          let bestContract = callContracts[0]
          let bestDiff = Math.abs(bestContract.strike_price - callStrike)
          for (const c of callContracts) {
            const diff = Math.abs(c.strike_price - callStrike)
            if (diff < bestDiff) { bestDiff = diff; bestContract = c }
          }

          addLog(`Best match: ${bestContract.ticker} (strike $${bestContract.strike_price})`)
          const optionPrice = await apiClient.fetchOptionHistoricalPrice(bestContract.ticker, entryDate)
          const premium = optionPrice ? optionPrice.c : null

          if (premium) {
            addLog(`Call premium on ${entryDate}: $${premium.toFixed(2)}`, 'success')

            let expiryStockPrice = null
            const actualExpiry = bestContract.expiration_date
            for (const day of priceHistory) {
              if (day.date === actualExpiry) { expiryStockPrice = day.close; break }
            }
            if (!expiryStockPrice) {
              expiryStockPrice = await apiClient.fetchStockPriceOnDate(ticker, actualExpiry)
            }

            const intrinsicAtExpiry = expiryStockPrice ? Math.max(0, expiryStockPrice - bestContract.strike_price) : null
            const pnl = intrinsicAtExpiry !== null ? (premium - intrinsicAtExpiry) * 100 : null

            trades.push({
              type: 'call',
              strike: bestContract.strike_price,
              contractTicker: bestContract.ticker,
              expiry: actualExpiry,
              dte,
              entryDate,
              entryPrice,
              premium,
              expiryStockPrice,
              intrinsicAtExpiry,
              pnl,
              delta: callDelta,
              expired: expiryStockPrice !== null && new Date(actualExpiry) <= today
            })

            if (expiryStockPrice) {
              addLog(`${ticker} at expiry (${actualExpiry}): $${expiryStockPrice.toFixed(2)}`, expiryStockPrice <= bestContract.strike_price ? 'success' : 'error')
              addLog(`Intrinsic at expiry: $${intrinsicAtExpiry.toFixed(2)}`, intrinsicAtExpiry === 0 ? 'success' : 'error')
              addLog(`P&L (1 contract): ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`, pnl >= 0 ? 'success' : 'error')
            } else {
              addLog(`Expiry ${actualExpiry} not yet reached`, 'info')
            }
          } else {
            addLog(`Could not fetch call option price for ${entryDate}`, 'error')
          }
        } else {
          addLog(`No call contracts found near $${callStrike}`, 'error')
        }
      }

      // Calculate summary
      const totalPremium = trades.reduce((sum, t) => sum + (t.premium || 0), 0)
      const totalPnl = trades.filter(t => t.pnl !== null).reduce((sum, t) => sum + t.pnl, 0)
      const allExpired = trades.every(t => t.expired)
      const winCount = trades.filter(t => t.pnl !== null && t.pnl >= 0).length
      const totalTrades = trades.filter(t => t.pnl !== null).length

      setResults({
        trades,
        summary: {
          ticker,
          entryDate,
          entryPrice,
          targetDelta,
          strategy,
          totalPremium,
          totalPnl,
          allExpired,
          winRate: totalTrades > 0 ? (winCount / totalTrades * 100).toFixed(0) : '-',
          histVol
        }
      })

      addLog(`Backtest complete! Total P&L: ${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`, totalPnl >= 0 ? 'success' : 'error')

    } catch (e) {
      setError(e.message)
      addLog(`Error: ${e.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }, [ticker, targetDelta, strategy, lookbackDays, dteTarget])

  const strategyLabel = strategy === 'sell_put' ? 'Sell Put' : strategy === 'sell_call' ? 'Sell Call' : 'Sell Strangle'

  return (
    <div>
      <div className="backtest-controls">
        <div className="backtest-control-group">
          <label>Ticker:</label>
          <input type="text" value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} style={{ width: 80, fontFamily: 'monospace', textTransform: 'uppercase' }} />
        </div>
        <div className="backtest-control-group">
          <label>Strategy:</label>
          <select value={strategy} onChange={e => setStrategy(e.target.value)}>
            <option value="sell_put">Sell Put</option>
            <option value="sell_call">Sell Call</option>
            <option value="sell_strangle">Sell Strangle</option>
          </select>
        </div>
        <div className="backtest-control-group">
          <label>Delta:</label>
          <select value={targetDelta} onChange={e => setTargetDelta(Number(e.target.value))}>
            {DELTAS.map(d => <option key={d} value={d}>{d}Δ</option>)}
          </select>
        </div>
        <div className="backtest-control-group">
          <label>Days ago:</label>
          <input type="number" value={lookbackDays} onChange={e => setLookbackDays(Number(e.target.value))} min={1} max={90} style={{ width: 60 }} />
        </div>
        <div className="backtest-control-group">
          <label>Target DTE:</label>
          <input type="number" value={dteTarget} onChange={e => setDteTarget(Number(e.target.value))} min={1} max={60} style={{ width: 60 }} />
        </div>
        <button className="btn btn-primary" onClick={runBacktest} disabled={loading}>
          {loading ? <Loader2 size={16} className="spin" /> : <Play size={16} />}
          Run Backtest
        </button>
      </div>

      {error && (
        <div className="card" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', marginBottom: 16 }}>
          <div style={{ color: '#ef4444', fontWeight: 500 }}>Error: {error}</div>
        </div>
      )}

      {results && (
        <div className="backtest-results">
          <div className="backtest-summary">
            <div className="backtest-stat neutral">
              <div className="value">{results.summary.ticker}</div>
              <div className="label">Ticker</div>
            </div>
            <div className="backtest-stat neutral">
              <div className="value">{strategyLabel} {results.summary.targetDelta}Δ</div>
              <div className="label">Strategy</div>
            </div>
            <div className="backtest-stat neutral">
              <div className="value">${results.summary.entryPrice.toFixed(2)}</div>
              <div className="label">Entry Price ({results.summary.entryDate})</div>
            </div>
            <div className="backtest-stat neutral">
              <div className="value">${(results.summary.totalPremium * 100).toFixed(0)}</div>
              <div className="label">Premium Collected (per contract)</div>
            </div>
            <div className={`backtest-stat ${results.summary.totalPnl >= 0 ? 'profit' : 'loss'}`}>
              <div className="value">{results.summary.totalPnl >= 0 ? '+' : ''}${results.summary.totalPnl.toFixed(2)}</div>
              <div className="label">P&L (per contract)</div>
            </div>
            <div className="backtest-stat neutral">
              <div className="value">{(results.summary.histVol * 100).toFixed(1)}%</div>
              <div className="label">Historical Vol (30d)</div>
            </div>
          </div>

          {/* Trades detail table */}
          <div className="card" style={{ padding: 0 }}>
            <div className="table-toggle" style={{ cursor: 'default' }}>
              <span>Trade Details</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Contract</th>
                    <th className="right">Strike</th>
                    <th className="right">Delta</th>
                    <th className="right">Premium</th>
                    <th className="right">Expiry</th>
                    <th className="right">Stock @ Exp</th>
                    <th className="right">Intrinsic</th>
                    <th className="right">P&L</th>
                    <th className="center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.trades.map((t, i) => (
                    <tr key={i}>
                      <td><span className="delta-badge" style={{ background: t.type === 'put' ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)', color: t.type === 'put' ? '#ef4444' : '#22c55e' }}>{t.type.toUpperCase()}</span></td>
                      <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{t.contractTicker}</td>
                      <td className="right" style={{ fontWeight: 600 }}>${t.strike}</td>
                      <td className="right" style={{ color: '#a0a0b0' }}>{(t.delta * 100).toFixed(1)}Δ</td>
                      <td className="right" style={{ color: '#22c55e', fontWeight: 600 }}>${t.premium?.toFixed(2) || '-'}</td>
                      <td className="right">{t.expiry}</td>
                      <td className="right" style={{ fontWeight: 600 }}>{t.expiryStockPrice ? `$${t.expiryStockPrice.toFixed(2)}` : 'Pending'}</td>
                      <td className="right" style={{ color: t.intrinsicAtExpiry === 0 ? '#22c55e' : '#ef4444' }}>{t.intrinsicAtExpiry !== null ? `$${t.intrinsicAtExpiry.toFixed(2)}` : '-'}</td>
                      <td className="right" style={{ fontWeight: 700, color: t.pnl >= 0 ? '#22c55e' : '#ef4444' }}>{t.pnl !== null ? `${t.pnl >= 0 ? '+' : ''}$${t.pnl.toFixed(2)}` : '-'}</td>
                      <td className="center">
                        <span style={{
                          padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                          background: t.expired ? (t.pnl >= 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)') : 'rgba(59,130,246,0.15)',
                          color: t.expired ? (t.pnl >= 0 ? '#22c55e' : '#ef4444') : '#3b82f6'
                        }}>
                          {t.expired ? (t.pnl >= 0 ? 'WIN' : 'LOSS') : 'OPEN'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Formula explanation */}
          <div className="chart-explanation" style={{ marginTop: 16 }}>
            <strong>Backtest Formula:</strong><br/>
            <code>P&L = (Premium Collected − Intrinsic at Expiry) × 100</code><br/>
            <code>Intrinsic (Put) = max(0, Strike − Stock Price at Expiry)</code><br/>
            <code>Intrinsic (Call) = max(0, Stock Price at Expiry − Strike)</code><br/>
            <strong>Delta Estimation:</strong> Black-Scholes cu historical vol × 1.1 (IV proxy). <code>d1 = (ln(S/K) + (r + σ²/2)T) / (σ√T)</code>
          </div>
        </div>
      )}

      {/* Execution log */}
      {logs.length > 0 && (
        <div className="backtest-log" style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, color: '#606070', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Execution Log</div>
          {logs.map((log, i) => (
            <div key={i} className={`backtest-log-entry ${log.type}`}>
              <span style={{ color: '#606070' }}>[{log.time}]</span> {log.msg}
            </div>
          ))}
        </div>
      )}

      {!results && !loading && logs.length === 0 && (
        <div className="card" style={{ padding: 64, textAlign: 'center' }}>
          <Target size={48} style={{ color: '#2a2a3a', marginBottom: 16 }} />
          <h3 style={{ color: '#a0a0b0', marginBottom: 8 }}>Options Backtest</h3>
          <p style={{ color: '#606070', fontSize: 14 }}>Configure parameters and click "Run Backtest" to simulate selling options at a specific delta.</p>
          <p style={{ color: '#606070', fontSize: 12, marginTop: 8 }}>Uses historical prices from Polygon.io + Black-Scholes delta estimation.</p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// MAIN APP
// ============================================================================

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  
  return (
    <>
      <style>{styles}</style>
      <header className="header">
        <div className="container header-inner">
          <div>
            <h1>Skew Tool Catalin v14</h1>
            <p>NU ARUNCATI CU PIETRE - Multi-Delta Options Skew • TastyTrade IV Metrics • Volatility Smile • Scanner</p>
          </div>
          <div className="header-right">
            <div className="tabs">
              <button 
                className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} 
                onClick={() => setActiveTab('dashboard')}
              >
                <LayoutDashboard size={16} /> Dashboard
              </button>
              <button
                className={`tab-btn ${activeTab === 'scanner' ? 'active' : ''}`}
                onClick={() => setActiveTab('scanner')}
              >
                <Table2 size={16} /> Scanner
              </button>
              <button
                className={`tab-btn ${activeTab === 'backtest' ? 'active' : ''}`}
                onClick={() => setActiveTab('backtest')}
              >
                <Target size={16} /> Backtest
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="main container">
        {activeTab === 'dashboard' ? (
          <DashboardTab />
        ) : activeTab === 'scanner' ? (
          <ScannerTab />
        ) : (
          <BacktestTab />
        )}
      </main>

      <footer>
        <div className="container">
          <p>Skew Tool Catalin v14 • TastyTrade IV Metrics • Scanner uses 25Δ monthly options (3rd Friday)</p>
          <p>P/C Ratio = Total Put Vol ÷ Total Call Vol (60 days)</p>
        </div>
      </footer>
    </>
  )
}
