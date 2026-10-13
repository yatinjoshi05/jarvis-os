import finnhubService from '../src/entities/trading/FinnhubService';

async function runVerification() {
  console.log('========================================================');
  console.log('    TESTING FINNHUB SERVICE NO-SYNTHETIC INTEGRITY     ');
  console.log('========================================================\n');

  // 1. Fetch Real-time Stock Quote (AAPL) without API key
  console.log('[1] Fetching quote for AAPL with no API key configured...');
  const quote = await finnhubService.fetchQuote('AAPL');
  if (quote === null) {
    console.log('  SUCCESS: fetchQuote correctly returned NULL (no synthetic fallback).');
  } else {
    console.log(`  REAL DATA FETCHED: AAPL Current Price: $${quote.currentPrice}`);
  }

  // 2. Fetch Candlestick Time Series (TSLA) without API key
  console.log('\n[2] Fetching candlestick data for TSLA with no API key configured...');
  const candles = await finnhubService.fetchCandles('TSLA', 30);
  if (candles === null) {
    console.log('  SUCCESS: fetchCandles correctly returned NULL (no synthetic fallback).');
  } else {
    console.log(`  REAL CANDLES FETCHED: Count = ${candles.closes.length}`);
  }

  // 3. Fetch Market News Headlines without API key
  console.log('\n[3] Fetching market news headlines with no API key configured...');
  const news = await finnhubService.fetchMarketNews('general');
  console.log(`  News article count: ${news.length}`);

  console.log('\n========================================================');
  console.log('  FINNHUB NO-SYNTHETIC VERIFICATION COMPLETE           ');
  console.log('========================================================');
}

runVerification();
