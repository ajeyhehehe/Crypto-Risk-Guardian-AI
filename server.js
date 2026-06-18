const express = require('express');
const https = require('https');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper: HTTPS GET returning JSON
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'CryptoRiskGuardian/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse error: ${data.slice(0, 200)}`)); }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// Cache layer
const cache = {};
const CACHE_TTL = 3000;

function cachedFetch(key, url, ttl = CACHE_TTL) {
  const now = Date.now();
  if (cache[key] && now - cache[key].ts < ttl) {
    return Promise.resolve(cache[key].data);
  }
  return fetchJSON(url).then(data => {
    cache[key] = { data, ts: now };
    return data;
  });
}

const ASSETS = {
  BTC: 'BTCUSDT', ETH: 'ETHUSDT', SOL: 'SOLUSDT', BNB: 'BNBUSDT',
  XRP: 'XRPUSDT', DOGE: 'DOGEUSDT', ADA: 'ADAUSDT', LINK: 'LINKUSDT',
  AVAX: 'AVAXUSDT', SUI: 'SUIUSDT', APT: 'APTUSDT', ARB: 'ARBUSDT',
  OP: 'OPUSDT', INJ: 'INJUSDT', TIA: 'TIAUSDT', SEI: 'SEIUSDT',
  PEPE: 'PEPEUSDT', WIF: 'WIFUSDT'
};

const VOLATILITY = {
  BTC: 0.55, ETH: 0.65, SOL: 0.85, BNB: 0.60, XRP: 0.75,
  DOGE: 0.95, ADA: 0.80, LINK: 0.80, AVAX: 0.90, SUI: 0.95,
  APT: 0.85, ARB: 0.85, OP: 0.85, INJ: 0.90, TIA: 0.95,
  SEI: 1.0, PEPE: 1.3, WIF: 1.4
};

const CORRELATIONS = {
  'BTC-ETH': 0.89, 'BTC-SOL': 0.82, 'BTC-BNB': 0.78, 'BTC-XRP': 0.72,
  'BTC-DOGE': 0.74, 'BTC-ADA': 0.79, 'BTC-LINK': 0.81, 'BTC-AVAX': 0.83,
  'BTC-SUI': 0.78, 'BTC-APT': 0.76, 'BTC-ARB': 0.84, 'BTC-OP': 0.83,
  'BTC-INJ': 0.77, 'BTC-TIA': 0.75, 'BTC-SEI': 0.76, 'BTC-PEPE': 0.62,
  'BTC-WIF': 0.60, 'ETH-SOL': 0.86, 'ETH-BNB': 0.80, 'ETH-ADA': 0.82,
  'ETH-LINK': 0.84, 'ETH-AVAX': 0.85, 'ETH-ARB': 0.87, 'ETH-OP': 0.86,
  'SOL-AVAX': 0.81, 'SOL-SUI': 0.79, 'SOL-APT': 0.77, 'DOGE-PEPE': 0.68,
  'DOGE-WIF': 0.65, 'PEPE-WIF': 0.71, 'ARB-OP': 0.88, 'INJ-TIA': 0.73, 'SEI-SUI': 0.74
};

function getCorrelation(a, b) {
  if (a === b) return 1.0;
  const key1 = `${a}-${b}`, key2 = `${b}-${a}`;
  return CORRELATIONS[key1] || CORRELATIONS[key2] || 0.65;
}

// GET /api/market-overview - comprehensive market data
app.get('/api/market-overview', async (req, res) => {
  try {
    const [fgData, btcTicker, ethTicker, solTicker, bnbTicker, xrpTicker] = await Promise.all([
      cachedFetch('fg', 'https://api.alternative.me/fng/?limit=30', 5000),
      cachedFetch('btc', 'https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT'),
      cachedFetch('eth', 'https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT'),
      cachedFetch('sol', 'https://api.binance.com/api/v3/ticker/24hr?symbol=SOLUSDT'),
      cachedFetch('bnb', 'https://api.binance.com/api/v3/ticker/24hr?symbol=BNBUSDT'),
      cachedFetch('xrp', 'https://api.binance.com/api/v3/ticker/24hr?symbol=XRPUSDT')
    ]);

    const btcFunding = await cachedFetch('funding-btc', 'https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT').catch(() => null);
    const ethFunding = await cachedFetch('funding-eth', 'https://fapi.binance.com/fapi/v1/premiumIndex?symbol=ETHUSDT').catch(() => null);
    const solFunding = await cachedFetch('funding-sol', 'https://fapi.binance.com/fapi/v1/premiumIndex?symbol=SOLUSDT').catch(() => null);

    res.json({
      prices: {
        BTC: { price: parseFloat(btcTicker.lastPrice), change24h: parseFloat(btcTicker.priceChangePercent), volume: parseFloat(btcTicker.quoteVolume) },
        ETH: { price: parseFloat(ethTicker.lastPrice), change24h: parseFloat(ethTicker.priceChangePercent), volume: parseFloat(ethTicker.quoteVolume) },
        SOL: { price: parseFloat(solTicker.lastPrice), change24h: parseFloat(solTicker.priceChangePercent), volume: parseFloat(solTicker.quoteVolume) },
        BNB: { price: parseFloat(bnbTicker.lastPrice), change24h: parseFloat(bnbTicker.priceChangePercent), volume: parseFloat(bnbTicker.quoteVolume) },
        XRP: { price: parseFloat(xrpTicker.lastPrice), change24h: parseFloat(xrpTicker.priceChangePercent), volume: parseFloat(xrpTicker.quoteVolume) }
      },
      fearGreed: {
        value: parseInt(fgData.data[0].value),
        classification: fgData.data[0].value_classification,
        history: fgData.data.map(d => ({ value: parseInt(d.value), ts: parseInt(d.timestamp) * 1000 }))
      },
      funding: {
        BTC: btcFunding ? parseFloat(btcFunding.lastFundingRate) : 0,
        ETH: ethFunding ? parseFloat(ethFunding.lastFundingRate) : 0,
        SOL: solFunding ? parseFloat(solFunding.lastFundingRate) : 0
      },
      marketCap: {
        total: 2.4e12,
        btcDominance: 54.2,
        change24h: parseFloat(btcTicker.priceChangePercent)
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/prices - all supported asset prices
app.get('/api/prices', async (req, res) => {
  try {
    const symbols = Object.values(ASSETS).map(s => `"${s}"`).join(',');
    const data = await cachedFetch('prices', `https://api.binance.com/api/v3/ticker/24hr?symbols=[${symbols}]`);
    const result = {};
    (Array.isArray(data) ? data : [data]).forEach(t => {
      const asset = Object.keys(ASSETS).find(k => ASSETS[k] === t.symbol);
      if (asset) {
        result[asset] = {
          price: parseFloat(t.lastPrice),
          change24h: parseFloat(t.priceChangePercent),
          high24h: parseFloat(t.highPrice),
          low24h: parseFloat(t.lowPrice),
          volume24h: parseFloat(t.quoteVolume),
          trades: t.count
        };
      }
    });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/klines/:symbol?interval=1h&limit=168
app.get('/api/klines/:symbol', async (req, res) => {
  try {
    const sym = req.params.symbol.toUpperCase() + 'USDT';
    const interval = req.query.interval || '1h';
    const limit = Math.min(parseInt(req.query.limit) || 168, 500);
    const data = await cachedFetch(`klines-${sym}-${interval}-${limit}`,
      `https://api.binance.com/api/v3/klines?symbol=${sym}&interval=${interval}&limit=${limit}`, 5000);
    res.json(data.map(k => ({
      time: k[0], open: parseFloat(k[1]), high: parseFloat(k[2]),
      low: parseFloat(k[3]), close: parseFloat(k[4]), volume: parseFloat(k[5])
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/watchlist - top 10 strongest assets
app.get('/api/watchlist', async (req, res) => {
  try {
    const symbols = Object.values(ASSETS).map(s => `"${s}"`).join(',');
    const data = await cachedFetch('watchlist', `https://api.binance.com/api/v3/ticker/24hr?symbols=[${symbols}]`);
    
    const assets = (Array.isArray(data) ? data : [data]).map(t => {
      const asset = Object.keys(ASSETS).find(k => ASSETS[k] === t.symbol);
      if (!asset) return null;
      const change = parseFloat(t.priceChangePercent);
      const volume = parseFloat(t.quoteVolume);
      const vol = VOLATILITY[asset] || 0.8;
      const momentum = change;
      const volumeGrowth = (volume / 1e9) * 100;
      const riskLevel = vol > 1.0 ? 'High' : vol > 0.7 ? 'Medium' : 'Low';
      const opportunityScore = Math.max(0, Math.min(100, (change * 2) + (volumeGrowth * 0.5) - (vol * 20) + 50));
      
      return {
        asset,
        price: parseFloat(t.lastPrice),
        change24h: change,
        momentum: momentum.toFixed(2),
        volumeGrowth: volumeGrowth.toFixed(2),
        volatility: (vol * 100).toFixed(0),
        riskLevel,
        opportunityScore: opportunityScore.toFixed(0)
      };
    }).filter(Boolean);

    assets.sort((a, b) => parseFloat(b.opportunityScore) - parseFloat(a.opportunityScore));
    res.json(assets.slice(0, 10));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/analyze - full risk analysis
app.post('/api/analyze', async (req, res) => {
  try {
    const { positions } = req.body;
    if (!positions || !positions.length) {
      return res.status(400).json({ error: 'No positions provided' });
    }

    const symbols = [...new Set(positions.map(p => p.asset))];
    const symbolPairs = symbols.map(s => `"${ASSETS[s]}"`).filter(Boolean).join(',');
    let priceData = {};
    try {
      const data = await fetchJSON(`https://api.binance.com/api/v3/ticker/24hr?symbols=[${symbolPairs}]`);
      (Array.isArray(data) ? data : [data]).forEach(t => {
        const asset = Object.keys(ASSETS).find(k => ASSETS[k] === t.symbol);
        if (asset) {
          priceData[asset] = {
            price: parseFloat(t.lastPrice),
            change24h: parseFloat(t.priceChangePercent),
            high24h: parseFloat(t.highPrice),
            low24h: parseFloat(t.lowPrice),
            volume24h: parseFloat(t.quoteVolume)
          };
        }
      });
    } catch (e) { /* use fallback */ }

    let totalValue = 0;
    let totalLeveragedExposure = 0;
    const positionDetails = positions.map(p => {
      const currentPrice = priceData[p.asset]?.price || p.entryPrice;
      const positionValue = p.quantity * currentPrice;
      const leveragedExposure = positionValue * p.leverage;
      totalValue += positionValue;
      totalLeveragedExposure += leveragedExposure;

      const pnl = p.side === 'LONG'
        ? (currentPrice - p.entryPrice) * p.quantity
        : (p.entryPrice - currentPrice) * p.quantity;
      const pnlPct = (pnl / (p.quantity * p.entryPrice)) * 100 * p.leverage;

      const liqPrice = p.side === 'LONG'
        ? currentPrice * (1 - 1 / p.leverage * 0.95)
        : currentPrice * (1 + 1 / p.leverage * 0.95);

      return {
        ...p,
        currentPrice,
        positionValue,
        leveragedExposure,
        pnl,
        pnlPct,
        liqPrice,
        weight: 0,
        volatility: VOLATILITY[p.asset] || 0.8
      };
    });

    totalValue = positionDetails.reduce((s, p) => s + p.positionValue, 0);
    positionDetails.forEach(p => p.weight = p.positionValue / totalValue);

    // RISK SCORE CALCULATION
    const avgLeverage = positions.reduce((s, p) => s + p.leverage, 0) / positions.length;
    const maxLeverage = Math.max(...positions.map(p => p.leverage));
    const leverageScore = Math.min(25, (avgLeverage / 50) * 15 + (maxLeverage / 125) * 10);

    const topWeight = positionDetails.sort((a, b) => b.weight - a.weight).slice(0, 2);
    const top2Concentration = topWeight.reduce((s, p) => s + p.weight, 0);
    const hhi = positionDetails.reduce((s, p) => s + p.weight * p.weight, 0);
    const concentrationScore = Math.min(20, top2Concentration * 15 + hhi * 10);

    const weightedVol = positionDetails.reduce((s, p) => s + p.volatility * p.weight, 0);
    const volatilityScore = Math.min(20, weightedVol * 18);

    let avgCorr = 0, corrCount = 0;
    for (let i = 0; i < positionDetails.length; i++) {
      for (let j = i + 1; j < positionDetails.length; j++) {
        avgCorr += getCorrelation(positionDetails[i].asset, positionDetails[j].asset);
        corrCount++;
      }
    }
    avgCorr = corrCount > 0 ? avgCorr / corrCount : 0.65;
    const correlationScore = Math.min(15, avgCorr * 17);

    const avgVolume = positionDetails.reduce((s, p) => {
      const vol = priceData[p.asset]?.volume24h || 50000000;
      return s + (p.positionValue / vol);
    }, 0) / positionDetails.length;
    const liquidityScore = Math.min(20, avgVolume * 200);

    const totalRisk = Math.round(leverageScore + concentrationScore + volatilityScore + correlationScore + liquidityScore);
    const safetyScore = Math.max(0, Math.min(100, 100 - totalRisk));

    // LIQUIDATION SIMULATION
    const scenarios = [-5, -10, -15, -20].map(drop => {
      let totalLoss = 0;
      let liquidatedCount = 0;
      positionDetails.forEach(p => {
        const lossPct = p.side === 'LONG' ? drop : -drop;
        const leveragedLoss = lossPct * p.leverage;
        totalLoss += (leveragedLoss / 100) * p.positionValue;
        if (p.side === 'LONG' && drop >= (1 / p.leverage) * 95) liquidatedCount++;
        if (p.side === 'SHORT' && -drop >= (1 / p.leverage) * 95) liquidatedCount++;
      });
      return {
        drop,
        portfolioLoss: totalLoss,
        lossPct: (totalLoss / totalValue) * 100,
        liquidationProb: Math.min(100, (liquidatedCount / positionDetails.length) * 100 + (Math.abs(drop) * avgLeverage * 0.5)),
        riskLevel: Math.abs(drop) * avgLeverage > 50 ? 'EXTREME' : Math.abs(drop) * avgLeverage > 25 ? 'HIGH' : 'MODERATE'
      };
    });

    const leverageLevel = avgLeverage <= 3 ? 'SAFE' : avgLeverage <= 8 ? 'MODERATE' : avgLeverage <= 15 ? 'HIGH' : 'EXTREME';

    // CORRELATION MATRIX
    const corrMatrix = [];
    const uniqueAssets = [...new Set(positions.map(p => p.asset))];
    uniqueAssets.forEach(a => {
      const row = { asset: a, correlations: {} };
      uniqueAssets.forEach(b => {
        row.correlations[b] = Math.round(getCorrelation(a, b) * 100) / 100;
      });
      corrMatrix.push(row);
    });

    // DIVERSIFICATION
    const sectors = {
      'Layer 1': ['BTC', 'ETH', 'SOL', 'ADA', 'AVAX', 'SUI', 'APT', 'SEI'],
      'DeFi': ['LINK', 'INJ'],
      'L2': ['ARB', 'OP'],
      'Meme': ['DOGE', 'PEPE', 'WIF'],
      'Exchange': ['BNB'],
      'Oracle': ['LINK'],
      'Data': ['TIA']
    };
    const sectorExposure = {};
    positionDetails.forEach(p => {
      let assigned = false;
      for (const [sector, assets] of Object.entries(sectors)) {
        if (assets.includes(p.asset)) {
          sectorExposure[sector] = (sectorExposure[sector] || 0) + p.weight * 100;
          assigned = true;
          break;
        }
      }
      if (!assigned) sectorExposure['Other'] = (sectorExposure['Other'] || 0) + p.weight * 100;
    });

    const diversificationRating = uniqueAssets.length >= 8 ? 'Excellent' :
      uniqueAssets.length >= 5 ? 'Good' : uniqueAssets.length >= 3 ? 'Fair' : 'Poor';

    // AI RECOMMENDATIONS
    const recommendations = [];
    if (top2Concentration > 0.5) {
      recommendations.push({
        type: 'concentration',
        priority: 'high',
        text: `Reduce ${topWeight[0].asset} exposure by ${Math.round((top2Concentration - 0.4) * 100)}%. Over ${Math.round(top2Concentration * 100)}% of capital is in ${topWeight.map(p => p.asset).join(' and ')}, creating concentration risk.`
      });
    }
    if (avgLeverage > 10) {
      recommendations.push({
        type: 'leverage',
        priority: 'critical',
        text: `Lower average leverage from ${avgLeverage.toFixed(1)}x to 5-8x. Current leverage exposes portfolio to ${Math.round(avgLeverage * 10)}% drawdown on a 10% market move.`
      });
    } else if (avgLeverage > 5) {
      recommendations.push({
        type: 'leverage',
        priority: 'medium',
        text: `Consider reducing leverage from ${avgLeverage.toFixed(1)}x to 3-5x for better risk-adjusted returns.`
      });
    }
    if (avgCorr > 0.8) {
      recommendations.push({
        type: 'correlation',
        priority: 'high',
        text: `Portfolio assets are highly correlated (avg: ${avgCorr.toFixed(2)}). Add uncorrelated assets or stablecoins to reduce systemic risk.`
      });
    }
    if (weightedVol > 0.8) {
      recommendations.push({
        type: 'volatility',
        priority: 'medium',
        text: `Portfolio weighted volatility is ${(weightedVol * 100).toFixed(0)}% annualized. Consider allocating 15-20% to stablecoins during high-volatility periods.`
      });
    }
    if (positionDetails.some(p => Math.abs(p.pnlPct) > 50)) {
      recommendations.push({
        type: 'drawdown',
        priority: 'high',
        text: `Some positions have >50% leveraged drawdown. Review stop-loss levels immediately.`
      });
    }
    if (uniqueAssets.length < 4) {
      recommendations.push({
        type: 'diversification',
        priority: 'medium',
        text: `Portfolio has only ${uniqueAssets.length} asset(s). Diversify across 4-8 uncorrelated assets for better risk management.`
      });
    }
    recommendations.push({
      type: 'stoploss',
      priority: 'always',
      text: `Set stop-losses at ${Math.max(2, Math.round(100 / avgLeverage * 0.5))}% below entry for longs, ${Math.max(2, Math.round(100 / avgLeverage * 0.5))}% above for shorts.`
    });

    const marketRiskLevel = totalRisk > 70 ? 'HIGH' : totalRisk > 45 ? 'ELEVATED' : totalRisk > 25 ? 'MODERATE' : 'LOW';

    res.json({
      totalValue,
      totalLeveragedExposure,
      riskScore: Math.min(100, totalRisk),
      safetyScore,
      marketRiskLevel,
      breakdown: {
        leverage: { score: Math.round(leverageScore), max: 25, detail: `Avg leverage: ${avgLeverage.toFixed(1)}x, Max: ${maxLeverage}x` },
        concentration: { score: Math.round(concentrationScore), max: 20, detail: `Top 2 assets: ${Math.round(top2Concentration * 100)}% of portfolio` },
        volatility: { score: Math.round(volatilityScore), max: 20, detail: `Weighted volatility: ${(weightedVol * 100).toFixed(0)}% annualized` },
        correlation: { score: Math.round(correlationScore), max: 15, detail: `Average correlation: ${avgCorr.toFixed(2)}` },
        liquidity: { score: Math.round(liquidityScore), max: 20, detail: `Portfolio/Volume ratio: ${(avgVolume * 100).toFixed(3)}%` }
      },
      positions: positionDetails,
      scenarios,
      leverageLevel,
      avgLeverage: avgLeverage.toFixed(1),
      corrMatrix,
      sectorExposure,
      diversificationRating,
      recommendations,
      priceData
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/trade-review
app.post('/api/trade-review', async (req, res) => {
  try {
    const { asset, side, leverage, positionSize } = req.body;
    const vol = VOLATILITY[asset] || 0.8;

    let currentPrice = 0;
    try {
      const data = await fetchJSON(`https://api.binance.com/api/v3/ticker/price?symbol=${ASSETS[asset]}`);
      currentPrice = parseFloat(data.price);
    } catch (e) { currentPrice = 0; }

    const maxDrawdown = vol * Math.sqrt(30 / 365) * leverage;
    const stopLossPct = Math.max(1, (1 / leverage) * 50);
    const stopLossPrice = side === 'LONG'
      ? currentPrice * (1 - stopLossPct / 100)
      : currentPrice * (1 + stopLossPct / 100);
    const takeProfitPct = stopLossPct * 2;
    const takeProfitPrice = side === 'LONG'
      ? currentPrice * (1 + takeProfitPct / 100)
      : currentPrice * (1 - takeProfitPct / 100);

    const liquidationDistance = (1 / leverage) * 100;
    const riskRating = leverage * vol > 10 ? 'EXTREME' : leverage * vol > 5 ? 'HIGH' : leverage * vol > 2 ? 'MODERATE' : 'LOW';

    const positionSizeRisk = positionSize > 10000 ? 'Large - consider scaling in' :
      positionSize > 5000 ? 'Moderate - acceptable for portfolio >$50k' : 'Small - appropriate sizing';

    const suggestedSize = currentPrice > 0 ? Math.min(positionSize, currentPrice * 0.01 * (1 / leverage) * 100) : positionSize;

    res.json({
      asset, side, leverage, positionSize, currentPrice,
      riskRating,
      maxDrawdown: (maxDrawdown * 100).toFixed(1),
      stopLossPct: stopLossPct.toFixed(1),
      stopLossPrice: stopLossPrice.toFixed(asset === 'BTC' ? 0 : asset === 'ETH' ? 1 : 4),
      takeProfitPrice: takeProfitPrice.toFixed(asset === 'BTC' ? 0 : asset === 'ETH' ? 1 : 4),
      liquidationDistance: liquidationDistance.toFixed(1),
      rewardRiskRatio: '2:1',
      positionSizeRisk,
      suggestedMaxSize: suggestedSize.toFixed(0),
      warning: leverage > 20 ? 'HIGH LEVERAGE WARNING: Position can be liquidated by a minor price move. Consider reducing leverage.' :
        leverage > 10 ? 'Elevated leverage. Ensure strict stop-loss is in place.' :
        vol > 1.0 ? 'High-volatility asset. Use wider stops and smaller position size.' : null
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Crypto Risk Guardian AI running on port ${PORT}`);
});
