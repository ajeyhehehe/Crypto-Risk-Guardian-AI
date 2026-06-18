# Crypto Risk Guardian AI

## Live Demo
MuleRun Demo:
https://jqxpgrfd.mule.page/

## Overview
Crypto Risk Guardian AI is an AI-powered risk intelligence platform that helps crypto traders identify liquidation risk, leverage exposure, portfolio weaknesses, and market threats before entering trades.

## Problem Statement
Many crypto traders focus on profits while ignoring risk. Excessive leverage, poor position sizing, and concentrated portfolios often lead to avoidable losses and liquidations.

Most existing platforms provide charts and market data but do not clearly explain risk in a simple and actionable way.

## Solution
Crypto Risk Guardian AI analyzes portfolio allocation, leverage exposure, volatility, correlation, and liquidation danger to provide AI-powered risk assessments and recommendations.

## Features
- **Portfolio Risk Analysis** — Multi-factor risk scoring with full transparency
- **Liquidation Simulator** — Stress test your portfolio under market conditions
- **Leverage Risk Detection** — Real-time leverage exposure monitoring
- **Diversification Analysis** — Asset allocation and sector exposure insights
- **Market Risk Dashboard** — Live market data with AI interpretation
- **AI Recommendations** — Actionable risk management advice
- **Real-Time Market Data** — Prices, funding rates, fear & greed index
- **Opportunity Watchlist** — Top assets ranked by opportunity score
- **Advanced Charts** — Multi-timeframe price action with technical indicators
- **Correlation Scanner** — Detect hidden portfolio risks
- **AI Trade Review** — Pre-trade risk assessment

## Tech Stack
- **Backend:** Node.js with Express 5
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Charts:** Chart.js for professional data visualization
- **APIs:** Binance API, Alternative.me Fear & Greed Index
- **Deployment:** Mule Pages (dynamic Node.js application)

## APIs Used
- **Binance API** — Real-time crypto prices, klines, funding rates, open interest
- **Alternative.me API** — Fear & Greed Index (30-day history)
- **Custom Risk Engine** — Portfolio analysis, correlation matrix, liquidation simulation

## How It Works
1. User enters portfolio positions (asset, quantity, entry price, leverage, direction)
2. AI analyzes risk exposure across 5 dimensions: leverage, concentration, volatility, correlation, liquidity
3. System calculates risk metrics with full transparency (every score explained)
4. User receives actionable recommendations based on portfolio analysis
5. User can simulate downside scenarios (-5%, -10%, -15%, -20% market drops)
6. Real-time market data provides context for trading decisions

## Key Differentiators
- **Full Transparency** — Every risk score includes detailed breakdown and explanation
- **Real-Time Data** — Live prices, funding rates, fear & greed (no fake data)
- **Multi-Factor Analysis** — 5 risk dimensions, not just one metric
- **Actionable Insights** — Plain English recommendations, not just numbers
- **Auto-Load Demo** — No empty screens, immediate value on page load
- **Mobile-First** — Works perfectly on all devices
- **No Authentication** — Instant access, no sign-up required

## Installation

### Prerequisites
- Node.js 18+
- npm

### Local Development
```bash
# Install dependencies
npm install

# Start the server
npm start

# Open in browser
# http://localhost:3000
```

### Production Deployment
The app is deployed as a dynamic Node.js application on Mule Pages.

```bash
# Bundle the app
mkdir deploy
tar czf deploy/app.tar.gz -C ./app .
echo '{}' > deploy/package.json

# Publish to Mule Pages
python3 scripts/publish.py ./deploy \
  --category dynamic \
  --command '["sh","-c","tar xzf app.tar.gz && exec node server.js"]' \
  --port 3000
```

## Demo
**Public Demo URL:** https://jqxpgrfd.mule.page/

The demo is live with real-time data from Binance and Alternative.me. All metrics update automatically every 3 seconds.

## Impact
The platform helps traders:
- Reduce liquidation risk through proactive monitoring
- Improve risk management with transparent scoring
- Preserve capital by identifying hidden dangers
- Make better trading decisions with AI-powered insights
- Avoid over-leveraging with clear danger warnings
- Diversify effectively with correlation analysis

## Future Roadmap
- Advanced AI predictions using machine learning models
- On-chain analytics integration (whale movements, exchange flows)
- Whale tracking and large transaction alerts
- Portfolio alerts via email/SMS/Telegram
- Multi-exchange support (Binance, Bybit, OKX, Coinbase)
- Historical backtesting of risk scenarios
- Social trading features and portfolio sharing
- Mobile app (iOS/Android)

## License
MIT License — Free to use, modify, and distribute.

---

**Built for traders who understand that risk management is the real edge.**

*"Protect Capital Before Chasing Profit"*
