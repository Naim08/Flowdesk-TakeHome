import { addTradingPair, fetchOrderbook, getGlobalPriceIndex } from '../../services/orderbook.service';
import { memoryStore } from '../../config/memorystore';
import Orderbook from '../../models/orderbook.model';
import { tradingPairExists, clearFetchOrderbookInterval } from '../../services/orderbook.service';
import { binanceWS } from '../../services/exchanges/binance/binance.service';

describe('Unit Test: Orderbook Service', () => {

  beforeAll(async () => {
    await fetchOrderbook();
  })
  afterAll(async () => {
    binanceWS.close();
    clearFetchOrderbookInterval();
  })

  test('tradingpairExists with BTCUSDT', async () => {
    const pair = 'BTCUSDT';
    const result = await tradingPairExists(pair);
    expect(result).toBe(true);
  });

  test('addTradingPair with BTCUSDT', async () => {
    const pair = 'BTCUSDT';
    addTradingPair(pair);
    const result = await memoryStore.get('tradingpair');
    expect(result).toContain(pair);
  });



  test('getGlobalPriceIndex with BTCUSDT', async () => {
    await new Promise(resolve => setTimeout(resolve, 4000));
    const result = await getGlobalPriceIndex("BTCUSDT");
    expect(result.pair).toBe("BTCUSDT");
    expect(result.price).toBeGreaterThan(0);
  })

})