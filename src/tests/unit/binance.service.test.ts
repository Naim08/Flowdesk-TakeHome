import { binanceWS, initializeBinanceWebSocket } from '../../services/exchanges/binance/binance.service';
import { fetchOrderbookBinanceRest } from '../../services/exchanges/binance/fetchOrderbookBinanceRest';
import { memoryStore } from '../../config/memorystore';

describe('Unit Test: Binance Service', () => {

  beforeAll(() => {
    initializeBinanceWebSocket(['BTCUSDT', 'ETHUSDT']);
  });

  let exchange = 'binance';
  afterAll(async () => {
    await binanceWS.close();
  });

  test('fetchOrderbookBinance with missing pair', async () => {
    const pair = '';
    await binanceWS.updatePairs([pair]);
    const orderbook = await memoryStore.get(`${exchange}-${pair}`);
    expect(orderbook).toBe(null);
  });

  test('checkTradingPair with valid trading pair', async () => {
    const pair = 'BTCUSDT';
    const result = await fetchOrderbookBinanceRest(pair);
    expect(result).toBe(undefined);
  });

  test('checkTradingPair with invalid trading pair', async () => {
    const pair = 'INVALID';
    const result = await fetchOrderbookBinanceRest(pair);
    expect(result).toBe(undefined);
  });




  test('fetchOrderbookBinance with invalid trading pair', async () => {
    const pairs = ['INVALIDONE', 'INVALIDTWO'];
    binanceWS.updatePairs(pairs);

    await new Promise(resolve => setTimeout(resolve, 5000));

    const orderbookOne = await memoryStore.get(`${exchange}-${pairs[0]}`);
    expect(orderbookOne).toBe(null);

    const orderbookTwo = await memoryStore.get(`${exchange}-${pairs[1]}`);
    expect(orderbookTwo).toBe(null);
  }, 10000);

});
